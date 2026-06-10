import express from "express";
import dotenv from "dotenv";
import pool from "./src/config/db.js";


dotenv.config();

const app = express();

app.use(express.json());

async function connectDB() {
  try {
    const connection = await pool.getConnection();

    console.log("MySQL Connected");

    connection.release();
  } catch (error) {
    console.error("Database Connection Failed");
    console.error(error.message);
  }
}

connectDB();

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});