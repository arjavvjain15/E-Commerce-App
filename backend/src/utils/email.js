import { SendEmailCommand } from "@aws-sdk/client-ses";
import { sesClient } from "../config/aws.js";
import dotenv from "dotenv";

dotenv.config();

export const sendEmail= async({to,subject,body})=>{
  const fromEmail= process.env.SES_SENDER_EMAIL;
  if(!fromEmail) throw new Error("Sender email not defined");
  const command= new SendEmailCommand({
    Source: fromEmail,
    Destination: {ToAddresses: [to]},
    Message:{
      Subject:{
        Data: subject,
        Charset: "UTF-8",
      },
      Body:{
        Text:{
          Data: body,
          Charset: "UTF-8",
        }
      }
    }
  });
  console.log("SENDER:", JSON.stringify(process.env.SES_SENDER_EMAIL));
  console.log("TO:", JSON.stringify(to));
  try{
    const response= await sesClient.send(command);
    console.log(`Email sent. MessageId:${response.MessageId}`);
    return response;
  }
  catch(error){
    console.error("Failed to send email",error);
    throw error;
  }
};