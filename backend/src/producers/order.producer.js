import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { sqsClient } from "../config/aws.js";
import dotenv from "dotenv";

dotenv.config();

export const sendOrderToQueue= async({orderId,userId,shippingAddress})=>{
  const queueUrl= PROCESS.ENV.ORDER_QUEUE_URL;
  if(!queueUrl) throw new Error("Queue URL is missing");
  const payload={
    orderId,userId,shippingAddress,
  }
  const command= new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(payload)
  });
  try{  
    const response= await sqsClient.send(command);
    console.log(`Producer pushed the message to queue. MessageId:${response.MessageId}, OrderId:${orderId}`);
    return response;
  }
  catch(error){
    console.error(`Producer failed to push order: ${orderId} into queue`,error);
    throw error;
  }
}

