import { ReceiveMessageCommand ,DeleteMessageCommand} from "@aws-sdk/client-sqs";
import { sqsClient } from "../config/aws.js";
import { sendEmail } from "../utils/email.js";
import dotenv from "dotenv";

dotenv.config();

const dlqUrl= process.env.ORDER_DLQ_URL;
const adminEmail= process.env.ADMIN_EMAIL;

export const processDlqMessage= async(message)=>{
    const body = JSON.parse(message.Body|| "{}");
    const { orderId, userId, shippingAddress } = body;
    console.log(`DLQ failed. OrderId:${orderId},UserId:${userId}`);
    const subject = "Order Processing Failed";
    const emailBody = `Attention Admin,
    An order has failed validation processing and was moved to the Dead-Letter Queue (DLQ).
    Order Details:
    ------------------------------------------
    - Order ID: ${orderId}
    - User ID: ${userId}
    - Shipping Address: ${shippingAddress || "None"}
    - Failure Reason: Shipping address is invalid (length less than 10 characters).
    ------------------------------------------
    Please review this order and contact the customer if necessary.
    
    Regards,
    E-Commerce Event-Driven Notification System`;
    
    await sendEmail({
        to: adminEmail,
        subject,
        body: emailBody,
      });
    
      console.log(`Admin notified by email for order: ${orderId}`);
      return true;
};

const pollDlqMessages = async () => {
    const params = {
      QueueUrl: dlqUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
      VisibilityTimeout: 30,
    };

    try{
      const data = await sqsClient.send(new ReceiveMessageCommand(params));
      if(data.Messages && data.Messages.length > 0) {
        console.log(`DLQ received ${data.Messages.length} messages`);
        for(const message of data.Messages) {
          try{
            const success = await processDlqMessage(message);
            if(success){
              await sqsClient.send(new DeleteMessageCommand({
                QueueUrl: dlqUrl,
                ReceiptHandle: message.ReceiptHandle,
              }));
              console.log(`Deleted message from DLQ. MessageId: ${message.MessageId}`);
            }
          }
          catch(error){
            console.error(`Failed to process DLQ message ${message.MessageId}:`,error.message);
          }
        }
      }
    }
    catch(error){
      console.error("Error polling the DLQ queue", error);
    }
  };
  
  const startWorker=() =>{
    if (!dlqUrl){
      console.error("Variable not configured");
      process.exit(1);
    }
    if(!adminEmail){
      console.error("Variable not configured");
      process.exit(1);
    }
  
    console.log(`Starting DLQ consumer worker on URL: ${dlqUrl}`);
    console.log(`Sending failure alerts to: ${adminEmail}`);
    console.log("Listening for dead-letter messages.");
  
    const loop = async ()=> {    //infinite loop
      while (true) {
        await pollDlqMessages();
      }
    };
    loop();
  };
  
  startWorker();
  