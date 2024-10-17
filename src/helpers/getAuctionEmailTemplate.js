const getAuctionEmailTemplate = (auction) => {
  return `
      <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
        <h2 style="color: #4CAF50;">Auction Reminder: ${auction.name}</h2>
        <p>Hello,</p>
        <p>We are excited to inform you that the auction <strong>${
          auction.name
        }</strong> in the category <strong>${
    auction.category
  }</strong> will start soon.</p>
        <p><strong>Starting Time:</strong> ${new Date(
          auction.activateTime
        ).toLocaleString()}</p>
        <p>Be sure to place your bid and secure your chance to win!</p>
        <p>For more details, visit our auction platform and stay updated.</p>
        <br />
        <p>Best regards,</p>
        <p>The Auction Team</p>
        <p style="font-size: 12px; color: #777;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `;
};

module.exports = getAuctionEmailTemplate;
