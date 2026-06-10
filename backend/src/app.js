import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import errorHandler from "./middleware/error.middleware.js";

const app = express();

app.use(
  cors({
    origin:["http://localhost:5174","http://localhost:5173"], 
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api", routes);

app.use(errorHandler);

export default app;
