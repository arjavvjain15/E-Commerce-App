import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import routes from "./routes/index.js";
import errorHandler from "./middleware/error.middleware.js";
import productRoutes from "./routes/product.routes.js";

const app = express();

app.use(
  cors({
    origin:["http://localhost:5173","http://localhost:5174"], 
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/uploads", express.static(path.resolve("uploads")));
app.use("/api/products", productRoutes);
app.use("/api", routes);


app.use(errorHandler);

export default app;
