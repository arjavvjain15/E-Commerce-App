import { S3Client, PutObjectCommand, CreateMultipartUploadCommand, UploadPartCommand,  CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const getS3ClientAndConfig= ()=>{
    const region= process.env.AWS_REGION;
    const accessKeyId= process.env.AWS_ACCESS_KEY||process.env.AWS_ACCESS_KEY_ID ;
    const secretAccessKey= process.env.AWS_SECRET_ACCESS_KEY;
    const bucket= process.env.AWS_S3_BUCKET;

    if(!region ||!accessKeyId ||!secretAccessKey ||!bucket){
        const error=new Error("AWS not configured");
        error.status=500;
        throw error;
    }
    const s3= new S3Client({
        region,
        credentials:{
            accessKeyId,
            secretAccessKey,
        }
    });
    return {s3,bucket,region};
};


export const uploadToS3= async(file)=>{
    const {s3,bucket,region}= getS3ClientAndConfig();
    const fileExtension= path.extname(file.originalname);
    const key= `${uuidv4()}${fileExtension}`;
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
    });
    await s3.send(command);

    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};


export const startMultipartUpload= async(fileName,contentType)=>{
    const {s3,bucket}= getS3ClientAndConfig();

    const fileExtension=path.extname(fileName);
    const key= `${uuidv4()}${fileExtension}`;

    const command= new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
    });

    const response= await s3.send(command);

    return {uploadId: response.UploadId, key, bucket};
};

export const uploadPart= async(uploadId,key, partNumber,buffer)=>{
    const {s3,bucket}= getS3ClientAndConfig();

    const command= new UploadPartCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: Number(partNumber),
        Body: buffer,
    });

    const response = await s3.send(command);

    return {ETag: response.ETag, PartNumber: Number(partNumber)};
};

export const completeMultipartUpload= async(uploadId,key,parts)=>{
    const {s3,bucket,region}=getS3ClientAndConfig();

    const list = parts.map((p)=>({
      PartNumber: Number(p.PartNumber||p.partNumber),
      ETag: p.ETag,
    })).sort((a, b) => a.PartNumber - b.PartNumber);

    const command= CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload:{
            Parts: list,
        }
    });

    await s3.send(command);

    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};


export const abortMultipartUpload= async(uploadId,key)=>{
    const {s3,bucket}= getS3ClientAndConfig();
    const command= new AbortMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
    });
    await s3.send(command);
    return true;
};


