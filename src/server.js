const { errorLogger, logger } = require("./shared/logger");
const app = require("./app");
const connectDB = require("./connection/connectDB");
const config = require("./config");
const { Server } = require("socket.io");
const socket = require("./socket/socket");
const seedAdmin = require("./app/DB");

// make changes------------------------------
async function main() {
  try {
    await connectDB();
    logger.info(`DB Connected Successfully at ${new Date().toLocaleString()}`);
    seedAdmin();

    console.log(config.port);
    const port =
      typeof config.port === "number" ? config.port : Number(config.port);

    // start server
    const server = app.listen(port, config.base_url, () => {
      logger.info(`App listening on port:${config.port}`);
    });
    // Set up Socket.IO-----------------
    const socketIO = new Server(server, {
      pingTimeout: 60000,
      cors: {
        origin: [
          "http://localhost:5173",
          "http://localhost:3001",
          "http://167.71.82.21:3003",
          "http://167.71.82.21",
          "http://142.93.65.179:3003",
          "http://142.93.65.179",
          "http://143.198.175.105:3030",
          "http://143.198.175.105:3000",
          "http://143.198.175.105",
          "http://192.168.10.25:3030",
          "http://159.203.183.245:4173",
          "http://159.203.183.245:4174",
          "http://192.168.10.26:3001",
          "http://192.168.10.25:3000",
          "https://sellaze.com",
          "https://admin.sellaze.com",
          "http://sellaze.com",
          "http://admin.sellaze.com",
          "http://localhost:5174",
          "http://167.71.20.155:4173",
          "https://167.71.20.155:4173",
          "http://167.71.20.155:4174",
          "https://167.71.20.155:4174",
        ],
      },
    });

    socket(socketIO);
    // Assign Socket.IO to global for potential use in other parts of the application
    global.io = socketIO;
    // handle unhandled promise rejections
    process.on("unhandledRejection", (error) => {
      logger.error("Unhandled Rejection:", error);
      // server.close(() => process.exit(1));
    });

    // handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      errorLogger.error("Uncaught Exception:", error);
      // process.exit(1);
    });

    // handle termination signals
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received");
      // server.close(() => process.exit(0));
    });
  } catch (err) {
    errorLogger.error("Main Function Error:", err);
    // process.exit(1);
  }
}

// start application
main();
