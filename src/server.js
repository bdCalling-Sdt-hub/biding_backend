const { errorLogger, logger } = require("./shared/logger");
const app = require("./app");
const connectDB = require("./connection/connectDB");
const config = require("./config");
const { Server } = require("socket.io");
const socket = require("./socket/socket");
const seedAdmin = require("./app/DB");
// make changes
async function main() {
  try {
    await connectDB();
    logger.info(`DB Connected Successfully at ${new Date().toLocaleString()}`);
    seedAdmin();
    const port =
      typeof config.port === "number" ? config.port : Number(config.port);

    // start server
    const server = app.listen(port, config.base_url, () => {
      logger.info(`App listening on http://192.168.10.32:${config.port}`);
    });

    // Set up Socket.IO-----------------
    const socketIO = new Server(server, {
      pingTimeout: 60000,
      cors: {
        origin: [
          "http://localhost:5173",
          "http://192.168.10.103:3000",
          "http://192.168.10.103:3001",
          "http://192.168.10.103:3002",
          "http://192.168.10.103:3003",
          "http://localhost:3003",
          "http://localhost:3004",
          "http://192.168.10.103:3004",
          "http://192.168.10.26:3000",
          "http://167.71.82.21:3000",
          "http://192.168.10.26",
          "http://167.71.82.21",
          "http://68.183.124.246:3003",
          "http://68.183.124.246",
          "http://167.71.82.21:3003",
          "http://167.71.82.21"
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
