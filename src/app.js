const express = require("express");
const cors = require("cors");
const globalErrorHandler = require("./app/middlewares/globalErrorHandler");
const routes = require("./app/routes");
const NotFoundHandler = require("./errors/NotFoundHandler");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const getUniqueUsersFromBidHistory = require("./helpers/getUniqueUsersFromBidHistory");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://192.168.10.103:3000",
      "http://192.168.10.103:3001",
      "http://192.168.10.103:3002",
      "http://192.168.10.103:3003",
      "http://192.168.10.103:3004",
      "http://192.168.10.103:3005",
      "http://localhost:3003",
      "http://localhost:3004",
      "http://103.161.9.133:3003",
      "http://192.168.10.103:3004",
      "http://192.168.10.26:3000",
      "http://192.168.10.26",
    ],
    credentials: true,
  })
);

// Parser--------------------
app.use(express.json());
// app.use(express.json({ limit: '900mb' }));
app.use(express.urlencoded({ extended: true }));
// app.use(express.urlencoded({ extended: true, limit: '900mb' }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads"));

// All Routes
app.use("/", routes);
app.get("/", async (req, res) => {
  res.json("Welcome to Bidding Website");
  const nun = await getUniqueUsersFromBidHistory("67176ba0eda7b41f66e6f12e");
  console.log("|num", nun);
});

// Global Error Handler
app.use(globalErrorHandler);

// Handle not found
app.use(NotFoundHandler.handle);

module.exports = app;
