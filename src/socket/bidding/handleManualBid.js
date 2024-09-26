const Auction = require("../../app/modules/auction/auction.model");

const handleManualBid = async (io, socket) => {
  socket.on("place-manual-bid", async (auctionId, userId) => {
    const auctionData = await Auction.findById(auctionId);
  });
};

module.exports = handleManualBid;
