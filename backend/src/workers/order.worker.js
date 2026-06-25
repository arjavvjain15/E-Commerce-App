import { ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { sqsClient } from "../config/aws.js";
import { Order, sequelize } from "../models/index.js";
import dotenv from "dotenv";

dotenv.config();

const queueUrl = process.env.ORDER_QUEUE_URL;

const processMessage = async (message) => {
  const body = JSON.parse(message.Body || "{}");
  const { orderId, userId, shippingAddress } = body;

  console.log(`[Order Worker] Processing order message. OrderId: ${orderId}, UserId: ${userId}`);

  // Fetch the order from MySQL
  const order = await Order.findByPk(orderId);
  if (!order) {
    console.error(`[Order Worker] Order with ID ${orderId} not found in database.`);
    // Since order doesn't exist, retrying is useless. Delete the message.
    return true;
  }

  // Validate the shipping address (address length < 10 is invalid)
  const isAddressValid = shippingAddress && shippingAddress.trim().length >= 10;

  if (!isAddressValid) {
    console.warn(`[Order Worker] Invalid shipping address: "${shippingAddress}" (length < 10).`);
    // Throw error so SQS retries this message
    throw new Error(`Address validation failed. Address: "${shippingAddress}" is too short.`);
  }

  // If valid, update status to confirmed
  await order.update({ status: "confirmed" });
  console.log(`[Order Worker] Order ${orderId} status successfully updated to "confirmed".`);

  return true; // Return true to indicate successful processing
};

const pollMessages = async () => {
  const params = {
    QueueUrl: queueUrl,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 20, // Long polling
    VisibilityTimeout: 30, // Visibility timeout in seconds
  };

  try {
    const data = await sqsClient.send(new ReceiveMessageCommand(params));
    if (data.Messages && data.Messages.length > 0) {
      console.log(`[Order Worker] Received ${data.Messages.length} messages.`);
      
      for (const message of data.Messages) {
        try {
          const success = await processMessage(message);
          if (success) {
            // Delete the message from the queue after successful processing
            await sqsClient.send(new DeleteMessageCommand({
              QueueUrl: queueUrl,
              ReceiptHandle: message.ReceiptHandle,
            }));
            console.log(`[Order Worker] Deleted processed message from queue. MessageId: ${message.MessageId}`);
          }
        } catch (error) {
          console.error(`[Order Worker] Error processing MessageId ${message.MessageId}:`, error.message);
          // Do NOT delete the message; SQS will retry after visibility timeout expires
        }
      }
    }
  } catch (error) {
    console.error("[Order Worker] Error polling queue:", error);
  }
};

const startWorker = async () => {
  try {
    // Authenticate and sync with database
    await sequelize.authenticate();
    console.log("[Order Worker] Connected to MySQL database successfully.");

    if (!queueUrl) {
      throw new Error("ORDER_QUEUE_URL environment variable is not defined.");
    }

    console.log(`[Order Worker] Starting SQS Order Queue worker on URL: ${queueUrl}`);
    console.log("[Order Worker] Listening for messages...");

    // Infinite polling loop
    while (true) {
      await pollMessages();
    }
  } catch (error) {
    console.error("[Order Worker] Worker initialization failed:", error);
    process.exit(1);
  }
};

startWorker();
