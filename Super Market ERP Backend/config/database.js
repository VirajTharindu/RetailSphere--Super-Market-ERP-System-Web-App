import "dotenv/config";
import { Sequelize } from "sequelize";

const isProd = process.env.APP_MODE === "PROD";

const dbName = isProd ? process.env.DB_NAME : `${process.env.DB_NAME}_test`;

// Support MySQL via env vars, otherwise fall back to a local SQLite DB for development
let sequelize;
if (dbName && process.env.DB_USERNAME) {
  sequelize = new Sequelize(
    dbName,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      dialect: "mysql",
      logging: false,
      pool: { max: 15 },
    },
  );
} else {
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: process.env.SQLITE_STORAGE || "database.sqlite",
    logging: false,
  });
  console.log(
    "⚠️  No MySQL credentials found, using SQLite fallback for local development.",
  );
}

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Database connection established successfully.
  🧠 DB MODE: ${isProd ? "PRODUCTION" : "TEST"} → ${dbName}`);
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
  }
};

testConnection();

export default sequelize;
