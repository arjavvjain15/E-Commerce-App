import { SQSClient } from "@aws-sdk/client-sqs";
import { SESClient } from "@aws-sdk/client-ses";
import dotenv from "dotenv";

dotenv.config();

const region = process.env.AWS_REGION || "ap-south-1";
const accessKeyId = process.env.AWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!accessKeyId || !secretAccessKey) console.warn("AWS not configured correctly");

const config={
  region,
  credentials:{
    accessKeyId,
    secretAccessKey,
  },
};

export const sqsClient = new SQSClient(config);
export const sesClient = new SESClient(config);
