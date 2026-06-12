import "dotenv/config";
import app from "./src/app.js";
import sequelize from "./src/config/db.js";

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("MySQL Connected");
  } catch (error) {
    console.error("Database Connection Failed");
    console.error(error.message);
  }
}

connectDB();

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});