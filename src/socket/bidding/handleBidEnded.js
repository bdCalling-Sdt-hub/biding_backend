const Auction = require("../../app/modules/auction/auction.model");
const { ENUM_AUCTION_STATUS } = require("../../utils/enums");

const handleBidEnded = async (io, socket) => {
  socket.on("ended-auction", async (auctionId) => {
    const updatedAuction = await Auction.findByIdAndUpdate(auctionId, {
      status: ENUM_AUCTION_STATUS.COMPLETED,
    });

    socket.broadcast.emit("updated-auction", { updatedAuction });
  });
};

module.exports = handleBidEnded;
