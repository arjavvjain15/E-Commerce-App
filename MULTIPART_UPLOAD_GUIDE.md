# AWS S3 Multipart Upload System Guide

This guide details the newly implemented S3 Multipart Upload system. It includes the API architecture, a step-by-step lifecycle explanation, comparative analysis against single-part uploads, and a fully functional React client implementation.

---

## 🎨 Architecture & Flow Overview

S3 Multipart Upload splits large files into chunk buffers, uploads them sequentially or in parallel, and asks S3 to combine them once finished.

```
+---------------+              +-----------------+              +----------------+
|               |              |                 |              |                |
|  React Client |              |  Express Router |              |  Amazon S3 API |
|               |              |                 |              |                |
+-------+-------+              +--------+--------+              +-------+--------+
        |                               |                               |
        |  1. POST /multipart/start     |                               |
        |------------------------------>|  2. CreateMultipartUpload     |
        |                               |------------------------------>|
        |                               |  3. Return UploadId & Key     |
        |                               |<------------------------------|
        |  4. Return UploadId & Key     |                               |
        |<------------------------------|                               |
        |                               |                               |
        |  5. POST /multipart/part      |                               |
        |     (Upload chunk buffer)     |                               |
        |------------------------------>|  6. UploadPartCommand         |
        |                               |------------------------------>|
        |                               |  7. Return Part ETag          |
        |                               |<------------------------------|
        |  8. Return Part ETag          |                               |
        |<------------------------------|                               |
        |     (Repeat steps 5-8)        |                               |
        |                               |                               |
        |  9. POST /multipart/complete  |                               |
        |     (Send all collected ETags)|                               |
        |------------------------------>|  10. CompleteMultipartUpload  |
        |                               |------------------------------>|
        |                               |  11. Final Combined S3 URL    |
        |                               |<------------------------------|
        |  12. Final Combined S3 URL    |                               |
        |<------------------------------|                               |
```

---

## 🔐 1. Lifecycle Steps Explained (Beginner-Friendly)

### Step 1: Start Upload (`CreateMultipartUploadCommand`)
* **Endpoint:** `POST /api/upload/multipart/start`
* **What happens:** The client tells the server it wants to upload a file of a specific content type. The backend generates a unique S3 object key (using a UUID) and requests a new multipart session from S3. S3 returns an **UploadId** which acts as the unique session token for this upload.
* **Why UploadId is needed:** The UploadId binds all subsequent chunk uploads to the same destination object. S3 uses it to keep track of incoming chunks for this specific session.

### Step 2: Upload Parts (`UploadPartCommand`)
* **Endpoint:** `POST /api/upload/multipart/part`
* **What happens:** The client splits the file into chunks (typically `5MB` or larger) and uploads them one by one. The server uploads each chunk buffer to S3 under the given `UploadId`, `key`, and `partNumber`. S3 responds with a unique checksum value called an **ETag** (Entity Tag) for each uploaded part.
* **What is an ETag & why it must be stored:** The ETag represents a cryptographic hash of the uploaded part. The client must store the ETag and its corresponding `partNumber` locally because they are required by S3 during the completion step to verify that no parts were corrupted or missed.

### Step 3: Complete Upload (`CompleteMultipartUploadCommand`)
* **Endpoint:** `POST /api/upload/multipart/complete`
* **What happens:** Once all chunks are successfully uploaded, the client sends the list of all collected `{ PartNumber, ETag }` blocks. S3 validates this list against the parts it received, stitches the chunks together in sequence on its servers, commits the combined file, and returns the final file URL.

### Step 4: Abort Upload (Optional / Best Practice)
* **Endpoint:** `DELETE /api/upload/multipart/abort`
* **What happens:** If an upload fails, is cancelled, or times out, the client notifies the server to call S3 to discard all uploaded parts.
* **Why aborting is important:** Unfinished multipart uploads store parts in your S3 bucket indefinitely, which **costs money**! Aborting deletes the temporary parts and stops billing.

---

## 💻 2. React Frontend Implementation Example

Here is a fully functional React implementation showing how to split a file into chunks, upload them sequentially, collect ETags, update progress, and complete the upload:

```jsx
import React, { useState } from "react";
import axios from "axios";

// Standard S3 rule: Minimum multipart chunk size is 5MB
const CHUNK_SIZE = 5 * 1024 * 1024; 

function VideoUpload() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);

    try {
      // Step 1: Start Multipart Upload Session
      const startRes = await axios.post("http://localhost:3000/api/upload/multipart/start", {
        fileName: file.name,
        contentType: file.type,
      }, { withCredentials: true });

      const { uploadId, key } = startRes.data;
      const totalParts = Math.ceil(file.size / CHUNK_SIZE);
      const parts = [];

      // Step 2: Upload chunks sequentially
      for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
        const start = (partNumber - 1) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        // Prepare FormData for the chunk
        const formData = new FormData();
        formData.append("uploadId", uploadId);
        formData.append("key", key);
        formData.append("partNumber", partNumber);
        formData.append("chunk", chunk);

        // Post the chunk to /part
        const partRes = await axios.post("http://localhost:3000/api/upload/multipart/part", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });

        // Collect ETag returned from S3
        parts.push({
          PartNumber: partNumber,
          ETag: partRes.data.ETag,
        });

        // Update progress percentage
        setProgress(Math.round((partNumber / totalParts) * 100));
      }

      // Step 3: Complete Multipart Upload Session
      const completeRes = await axios.post("http://localhost:3000/api/upload/multipart/complete", {
        uploadId,
        key,
        parts,
      }, { withCredentials: true });

      setFileUrl(completeRes.data.imageUrl);
      alert("Upload completed successfully!");
    } catch (err) {
      console.error("Multipart Upload Failed:", err);
      alert("Upload failed. Make sure to abort any incomplete session to avoid charges.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h3>S3 Multipart Uploader</h3>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} disabled={uploading} />
      <button onClick={handleUpload} disabled={!file || uploading} style={{ marginLeft: "10px" }}>
        {uploading ? "Uploading..." : "Upload File"}
      </button>

      {uploading && (
        <div style={{ marginTop: "20px" }}>
          <div style={{ background: "#eee", width: "100%", height: "20px", borderRadius: "10px" }}>
            <div style={{ background: "#4caf50", width: `${progress}%`, height: "100%", borderRadius: "10px", transition: "width 0.3s" }} />
          </div>
          <p>{progress}% Uploaded</p>
        </div>
      )}

      {fileUrl && (
        <p style={{ marginTop: "20px" }}>
          Uploaded S3 URL: <a href={fileUrl} target="_blank" rel="noreferrer">{fileUrl}</a>
        </p>
      )}
    </div>
  );
}

export default VideoUpload;
```

---

## 📊 3. Comparison: Single vs. Multipart Upload

| Feature | Single-Part Upload (`PutObjectCommand`) | Multipart Upload (Create + Upload + Complete) |
| :--- | :--- | :--- |
| **Performance** | Faster for small files because there is only one HTTP request round-trip. | Faster for large files by uploading multiple parts in parallel. |
| **Reliability & Retry**| If the upload breaks at 99%, you must re-upload the entire file. | If a single 5MB chunk fails, you only need to retry that specific chunk. |
| **Memory footprint** | Reads the whole file into RAM at once, which can crash the server on large files. | Streams or slices chunks one at a time, keeping RAM usage low. |
| **Maximum File Size** | 5 GB limit per object. | Up to 5 TB limit per object. |
| **Use Cases** | Small images, profile pictures, JSON documents, icons. | Large videos, archives (.zip/.tar), logs, dataset dumps. |
