require("dotenv").config();

const { startListener } = require("./adapters/rocketchatListener");
const { startScheduler } = require("./services/schedulerService");
const { startHttpServer } = require("./httpServer");
const logger = require("./utils/logger");

logger.log("Starting Rocket.Chat OpenClaw backend...");

startScheduler();
startHttpServer();
startListener();
