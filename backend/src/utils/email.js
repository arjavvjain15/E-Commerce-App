import { SendEmailCommand } from "@aws-sdk/client-ses";
import { sesClient } from "../config/aws.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Sends a notification email using AWS SES.
 *
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.body - Plain text email body
 */
export const sendEmail = async ({ to, subject, body }) => {
  const fromEmail = process.env.SES_SENDER_EMAIL;
  if (!fromEmail) {
    throw new Error("SES_SENDER_EMAIL environment variable is not defined.");
  }

  const command = new SendEmailCommand({
    Source: fromEmail,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {
        Text: {
          Data: body,
          Charset: "UTF-8",
        },
      },
    },
  });

  try {
    const response = await sesClient.send(command);
    console.log(`Email sent successfully. MessageId: ${response.MessageId}`);
    return response;
  } catch (error) {
    console.error("Failed to send email via AWS SES:", error);
    throw error;
  }
};
