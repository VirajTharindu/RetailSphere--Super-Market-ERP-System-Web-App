import "dotenv/config";
import { Options } from "sequelize";

const isProd = process.env.APP_MODE === "PROD";
const dbName = isProd ? process.env.DB_NAME : `${process.env.DB_NAME}_test`;

const config: Record<string, Options> = {
  test: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: dbName,
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    dialect: "mysql",
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: dbName,
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    dialect: "mysql",
  },
};

export default config;
