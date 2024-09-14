const registrationSuccess = (data) => `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 5px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: #333;
          font-size: 24px;
          margin-bottom: 10px;
        }
        p {
          color: #555;
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 10px;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #007bff;
          color: #ffffff;
          text-decoration: none;
          border-radius: 5px;
          font-size: 16px;
        }
        .button:hover {
          background-color: #0056b3;
        }
        a {
          color: #007bff;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Welcome to Bidding Website</h1>
        <p>Dear ${data?.user?.name ? data?.user?.name : data?.admin?.name},</p>
        <p>Thank you for registering with Bidding Website. We are excited to have you on board and look forward to helping you make the most of our services.</p>
        <p>If you have any questions or need assistance, please feel free to reach out to us at <a href="mailto:thakursaad613@gmail.com">thakursaad613@gmail.com</a>.</p>
        <p>Best regards,<br>The Bidding Website Team</p>
      </div>
    </body>
  </html>
`;

module.exports = {
  registrationSuccess,
};
