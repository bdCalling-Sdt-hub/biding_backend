const registrationSuccessEmailBody = (userData) => `
  <html>
    <head>
      <style>
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f7f9fc;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .header {
          background-color: #007bff;
          padding: 20px;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          color: #ffffff;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 30px;
          color: #333333;
        }
        .content h2 {
          font-size: 22px;
          color: #333333;
          margin-bottom: 20px;
          font-weight: 600;
        }
        .content p {
          font-size: 16px;
          color: #666666;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .activation-code {
          font-size: 28px;
          color: #007bff;
          font-weight: 700;
          text-align: center;
          margin-bottom: 20px;
        }
        .button-container {
          text-align: center;
          margin: 40px 0;
        }
        .button {
          padding: 12px 30px;
          background-color: #007bff;
          color: #ffffff;
          text-decoration: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
        }
        .button-text {
          color: #fff;
        }
        .button:hover {
          background-color: #0056b3;
        }
        .footer {
          padding: 20px;
          font-size: 14px;
          color: #999999;
          text-align: center;
          background-color: #f7f9fc;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
        }
        .footer p {
          margin: 5px 0;
        }
        .footer a {
          color: #007bff;
          text-decoration: none;
        }
        .footer a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Bidding Website</h1>
        </div>
        <div class="content">
          <h2>Hello, ${userData?.user?.name}</h2>
<<<<<<< HEAD
          <p>Thank you for registering with Bidding Website. To activate your account, please use the following activation link.</p>
          <p>Please click this link within the next 5 minutes.</p>
          <div class="button-container">
            <a href=${`http://192.168.10.32:6053/user/auth/activate-user?email=${userData?.email}&code=${userData?.activationCode}`} class="button">
=======
          <p>Thank you for registering with Bidding Website. To activate your account, please click the button below:</p>

          <div class="button-container">
            <a href="http://localhost:3000/activate?email=${encodeURIComponent(
              userData?.user?.email
            )}&code=${encodeURIComponent(
  userData?.activationCode
)}" class="button">
>>>>>>> 01303fd963965852ba43c98a68a5de1447908d41
              <span class="button-text">Activate Now</span>
            </a>
          </div>

          <p>If you didn't register for Bidding Website, please ignore this email.</p>
          <p>If you have any questions, feel free to contact us at <a href="mailto:thakursaad613@gmail.com">thakursaad613@gmail.com</a>.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Bidding Website. All rights reserved.</p>
          <p><a href="https://yourwebsite.com/privacy">Privacy Policy</a> | <a href="https://yourwebsite.com/contact">Contact Us</a></p>
        </div>
      </div>
    </body>
  </html>
`;

module.exports = {
  registrationSuccessEmailBody,
};
