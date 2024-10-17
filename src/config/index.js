const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from .env file
dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

// Validate configuration and throw errors if required environment variables are missing
const validateConfig = (config) => {
  if (!config.jwt.secret) {
    throw new Error("Missing JWT secret");
  }
  if (!config.database_url) {
    throw new Error("Missing database URL");
  }
  // Add more validation as needed
};

// Define your configuration
const config = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  base_url: process.env.BASE_URL,
  database_url: process.env.MONGO_URL,
  database_password: process.env.DB_PASSWORD,
  default_admin_password: process.env.DEFAULT_ADMIN_PASSWORD,
  image_url: process.env.IMAGE_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    refresh_secret: process.env.JWT_REFRESH_SECRET,
    expires_in: process.env.JWT_EXPIRES_IN,
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  },
  smtp: {
    smtp_host: process.env.SMTP_HOST,
    smtp_port: process.env.SMTP_PORT,
    smtp_service: process.env.SMTP_SERVICE,
    smtp_mail: process.env.SMTP_MAIL,
    smtp_pass: process.env.SMTP_PASS,
    NAME: process.env.SERVICE_NAME,
  },
  cloudinary: {
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
    couldinary_url: process.env.CLOUDINARY_URL,
  },
  sendgrid: {
    from_email: process.env.FORM_EMAIL,
    api_key: process.env.SEND_GRIDAPI_KEY,
  },
  stripe: {
    stripe_secret_key: process.env.STRIPE_SECRET_KEY,
  },
};

// Validate configuration
validateConfig(config);

module.exports = config;
