import { sequelize } from "./src/models/index.js";

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log("Connected to database for migration.");
    
    const [results] = await sequelize.query("SHOW COLUMNS FROM `Products` LIKE 'status'");
    if (results.length === 0) {
      console.log("Adding column status to Products table...");
      await sequelize.query("ALTER TABLE `Products` ADD COLUMN `status` ENUM('active', 'draft') NOT NULL DEFAULT 'active';");
      console.log("Migration complete!");
    } else {
      console.log("Column status already exists on Products table.");
    }
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
