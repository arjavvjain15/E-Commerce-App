import { ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { sqsClient } from "../config/aws.js";
import { Order, sequelize } from "../models/index.js";
import dotenv from "dotenv";

dotenv.config();

const queueUrl=process.env.ORDER_QUEUE_URL;

export const processMessage= async(message)=>{
    const body= JSON.parse(message.Body||{});
    const {orderId, userId,shippingAddress}= body;
    console.log(`[Order Worker] Processing order message. OrderId: ${orderId}, UserId: ${userId}`);

    const order= await Order.findByPk(orderId);
    if(!order){
        console.error("Order not found");
        return true;
    }
    const isAddressValid= shippingAddress&& shippingAddress.trim().length>=10;
    if(!isAddressValid) throw new Error ("Address too short");
    await order.update({status:"confirmed"});
    console.log(`Order ${orderId} is confimed`);
    return true;
};

const pollMessages = async () => {
    const params = {
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20, 
      VisibilityTimeout: 30, 
    };
  
    try {
      const data = await sqsClient.send(new ReceiveMessageCommand(params));
      if(data.Messages && data.Messages.length > 0){
        console.log(`Order Received: ${data.Messages.length} messages`)
        for (const message of data.Messages) {
          try{
            const success = await processMessage(message);
            if(success){
              await sqsClient.send(new DeleteMessageCommand({
                QueueUrl: queueUrl,
                ReceiptHandle: message.ReceiptHandle,
              }));
              console.log(`Deleted from queue ${message.MessageId}`);
            }
          }
          catch(error){
            console.error(error);
          }
        }
      }
    }
    catch(error){
      console.error("Polling error", error);
    }
};

const startWorker = async () => {
    try{ 
      await sequelize.authenticate();
      console.log("[Order Worker] Connected to MySQL database successfully.");
      if(!queueUrl) throw new Error("Variable not defined");
      console.log(`SQS worker started on Main queue`);
      console.log("Listening for messages");

      while (true) {                //infinite polling 
        await pollMessages();
      }
    }
    catch(error){
      console.error("Worker failed", error);
      process.exit(1);
    }
};
  
startWorker();
  