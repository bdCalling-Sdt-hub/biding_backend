const getUserDetailsFromToken = require("../helpers/getUserDetailsFromToken");

const handleBidding = require("./bidding/bidding");
const handleManualBid = require("./bidding/handleManualBid");
const handleNotification = require("./notification");

// online user
const onlineUser = new Set();
const socket = (io) => {
  io.on("connection", async (socket) => {
    console.log("A user connected");
    const token = socket.handshake.auth.token;
    const currentUser = await getUserDetailsFromToken(token);
    const currentUserId = currentUser?._id.toString();
    // create room -----------
    socket.join(currentUserId);

    // set online user---------------------------
    onlineUser.add(currentUserId);
    // send to the client-----------------
    io.emit("onlineUser", Array.from(onlineUser));

    // handle live bidding
    handleBidding(io, socket);

    //
    handleManualBid(io, socket);

    // handle notification
    handleNotification(currentUserId, io, socket);

    // Disconnect user ---------------------
    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });
};

module.exports = socket;
