import { Sequelize } from "sequelize";
// @ts-ignore @typescript-eslint/no-unused-vars
import { User, BizPost, CommandLog, GweiRequest } from "./models/index.js";

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./src/data/database.sqlite",
  logging: console.log,
});

const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    await sequelize.sync({ alter: true });

    console.log("Database synchronized successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

export { sequelize, initDatabase };
