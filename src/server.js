const { errorLogger, logger } = require("./shared/logger");
const app = require("./app");
const connectDB = require("./connection/connectDB");
const config = require("./config");

async function main() {
  try {
    await connectDB();
    logger.info(`DB Connected Successfully at ${new Date().toLocaleString()}`);

    const port =
      typeof config.port === "number" ? config.port : Number(config.port);

    // start server
    const server = app.listen(port, config.base_url, () => {
      logger.info(`App listening on http://192.168.10.32:${config.port}`);
    });

    // handle unhandled promise rejections
    process.on("unhandledRejection", (error) => {
      logger.error("Unhandled Rejection:", error);
      server.close(() => process.exit(1));
    });

    // handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      errorLogger.error("Uncaught Exception:", error);
      process.exit(1);
    });

    // handle termination signals
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received");
      server.close(() => process.exit(0));
    });
  } catch (err) {
    errorLogger.error("Main Function Error:", err);
    process.exit(1);
  }
}

// start application
main();
