import { ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { sqsClient } from "../config/aws.js";
import { sendEmail } from "../utils/email.js";
import dotenv from "dotenv";

dotenv.config();

const dlqUrl = process.env.ORDER_DLQ_URL;
const adminEmail = process.env.ADMIN_EMAIL;

const processDlqMessage = async (message) => {
  const body = JSON.parse(message.Body || "{}");
  const { orderId, userId, shippingAddress } = body;

  console.log(`[DLQ Worker] Processing failed order message from DLQ. OrderId: ${orderId}, UserId: ${userId}`);

  // Draft the email details
  const subject = "Order Processing Failed";
  const emailBody = `
Attention Admin,

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
E-Commerce Event-Driven Notification System
`;

  // Send email to admin using AWS SES
  await sendEmail({
    to: adminEmail,
    subject,
    body: emailBody,
  });

  console.log(`[DLQ Worker] Admin notified successfully via email for OrderId: ${orderId}`);
  return true;
};

const pollDlqMessages = async () => {
  const params = {
    QueueUrl: dlqUrl,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 20, // Long polling
    VisibilityTimeout: 30,
  };

  try {
    const data = await sqsClient.send(new ReceiveMessageCommand(params));
    if (data.Messages && data.Messages.length > 0) {
      console.log(`[DLQ Worker] Received ${data.Messages.length} dead-letter messages.`);

      for (const message of data.Messages) {
        try {
          const success = await processDlqMessage(message);
          if (success) {
            // Delete message from DLQ
            await sqsClient.send(new DeleteMessageCommand({
              QueueUrl: dlqUrl,
              ReceiptHandle: message.ReceiptHandle,
            }));
            console.log(`[DLQ Worker] Deleted message from DLQ. MessageId: ${message.MessageId}`);
          }
        } catch (error) {
          console.error(`[DLQ Worker] Failed to process DLQ message ${message.MessageId}:`, error.message);
          // Do not delete from DLQ so it will try again
        }
      }
    }
  } catch (error) {
    console.error("[DLQ Worker] Error polling DLQ queue:", error);
  }
};

const startWorker = () => {
  if (!dlqUrl) {
    console.error("[DLQ Worker] ORDER_DLQ_URL environment variable is not defined.");
    process.exit(1);
  }
  if (!adminEmail) {
    console.error("[DLQ Worker] ADMIN_EMAIL environment variable is not defined.");
    process.exit(1);
  }

  console.log(`[DLQ Worker] Starting DLQ consumer worker on URL: ${dlqUrl}`);
  console.log(`[DLQ Worker] Sending failure alerts to: ${adminEmail}`);
  console.log("[DLQ Worker] Listening for dead-letter messages...");

  // Infinite polling loop
  const loop = async () => {
    while (true) {
      await pollDlqMessages();
    }
  };
  loop();
};

startWorker();
