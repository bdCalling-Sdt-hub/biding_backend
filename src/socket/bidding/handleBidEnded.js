const Auction = require("../../app/modules/auction/auction.model");
const { ENUM_AUCTION_STATUS } = require("../../utils/enums");

const handleBidEnded = async (io, socket) => {
  socket.on("ended-auction", async (auctionId) => {
    const auction = await Auction.findByIdAndUpdate(auctionId, {
      status: ENUM_AUCTION_STATUS.COMPLETED,
    });

    socket.broadcast.emit("updated-auction", auction);
  });
};

module.exports = handleBidEnded;
