
## Architecture & Flow Overview

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

##  1. Lifecycle Steps Explained (Beginner-Friendly)

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

## 📊 3. Comparison: Single vs. Multipart Upload

| Feature | Single-Part Upload (`PutObjectCommand`) | Multipart Upload (Create + Upload + Complete) |
| :--- | :--- | :--- |
| **Performance** | Faster for small files because there is only one HTTP request round-trip. | Faster for large files by uploading multiple parts in parallel. |
| **Reliability & Retry**| If the upload breaks at 99%, you must re-upload the entire file. | If a single 5MB chunk fails, you only need to retry that specific chunk. |
| **Memory footprint** | Reads the whole file into RAM at once, which can crash the server on large files. | Streams or slices chunks one at a time, keeping RAM usage low. |
| **Maximum File Size** | 5 GB limit per object. | Up to 5 TB limit per object. |
| **Use Cases** | Small images, profile pictures, JSON documents, icons. | Large videos, archives (.zip/.tar), logs, dataset dumps. |