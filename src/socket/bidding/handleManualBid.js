const httpStatus = require("http-status");
const Auction = require("../../app/modules/auction/auction.model");
const User = require("../../app/modules/user/user.model");
const ApiError = require("../../errors/ApiError");
const { ENUM_AUCTION_STATUS } = require("../../utils/enums");

const handleManualBid = async (io, socket) => {
  socket.on("place-manual-bid", async (data) => {
    // console.log("emited", auctionId);
    // console.log("userid", userId);
    console.log("dat", data);
    const auctionId = data?.auction_id;
    const userId = data?.user_id;
    // try {
    const auction = await Auction.findOne({
      _id: auctionId,
      status: ENUM_AUCTION_STATUS.ACTIVE,
    })
      //   .select(
      //     "bidBuddyUsers currentPrice incrementValue bidHistory countdownTime reservedBid totalBidPlace winingBidder"
      //   )
      .populate({
        path: "bidHistory.user",
        // select: "name profile_image",
      });

    if (!auction) {
      throw new ApiError(httpStatus.NOT_FOUND, "Auction not found");
    }

    console.log("auction", auction);

    const user = await User.findById(userId).select("availableBid");
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.availableBid < auction?.reservedBid) {
      io.to(userId).emit("socket-error", {
        errorMessage: "You don't have available bids",
      });
      return;
    }

    await User.findByIdAndUpdate(userId, {
      $inc: { availableBid: -auction?.reservedBid },
    });

    const newBidAmount = auction.currentPrice + auction.incrementValue;

    const newBid = {
      user: userId,
      bidAmount: newBidAmount,
    };
    auction.bidHistory.push(newBid);

    // Update the auction details
    auction.currentPrice = newBidAmount;
    auction.totalBidPlace += 1;
    auction.winingBidder = newBid;
    //auction.countdownTime = 9;

    // Set activateTime to 9 seconds ago
    const currentTime = new Date();
    auction.activateTime = new Date(currentTime.getTime() - 9 * 1000);

    //save auction
    await auction.save();

    console.log("updatedAuction", auction);
    // here send just last 10 history
    const updatedBidHistory = auction.bidHistory.slice(-10).reverse();

    // Emit the updates to all clients in the auction room
    // io.to(auctionId).emit("updateCountdown", {
    //   countdownTime: auction.countdownTime,
    // });

    const updatedAuction = await Auction.findById(auctionId)
      .populate({
        path: "bidHistory.user",
      })
      .populate({ path: "bidBuddyUsers.user" });

    console.log("aucitonsldkjfd", updatedAuction);
    io.to(auctionId).emit("bidHistory", { updatedAuction });
    // socket.broadcast.emit("updated-auction", { updatedAuction });
    socket.broadcast.emit("updated-auction", {
      endedTime: null,
      _id: "66f3ebc84c2442eb72c21fe7",
      name: "Updated Auction",
      category: "Vehicles",
      reservedBid: 5000,
      incrementValue: 200,
      startingDate: "2024-09-26T00:00:00.000Z",
      startingTime: "16:23",
      description:
        "A vintage car auction featuring classic cars from the 1960s.",
      images: [
        "https://res.cloudinary.com/dp6nuvot3/image/upload/v1727261638/1727261636304-pexels-pixabay-56866.jpg",
        "https://res.cloudinary.com/dp6nuvot3/image/upload/v1727261639/1727261636308-3df5ca6a9b470f715b085991144a5b76e70da975..webp",
        "https://res.cloudinary.com/dp6nuvot3/image/upload/v1727267437/1727267435661-Screenshot_19.png.png",
      ],
      status: "ACTIVE",
      totalBidPlace: 46,
      countdownTime: null,
      winingBidder: {
        user: {
          _id: "66f4f9004569f0abd53d1fc4",
          name: "Shaharul Siyam",
          profile_image:
            "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
        },
        bidAmount: 9200,
        _id: "66f79caf64f5b9d29f465a1c",
      },
      activateTime: "2024-09-28T06:05:26.752Z",
      bidBuddyUsers: [],
      bidHistory: [
        {
          user: {
            _id: "66f776c9cde84b9040e73889",
            name: "Shukumar Ghosh (Frontend Developer)",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocLefbDUZSjV0IpxHlc54I584NdpLnpztZ5ZXsUGOOeOqI_bITd3=s96-c",
          },
          bidAmount: 200,
          time: "2024-09-28T03:47:45.509Z",
          _id: "66f77caff21b06959477c279",
        },
        {
          user: {
            _id: "66f776c9cde84b9040e73889",
            name: "Shukumar Ghosh (Frontend Developer)",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocLefbDUZSjV0IpxHlc54I584NdpLnpztZ5ZXsUGOOeOqI_bITd3=s96-c",
          },
          bidAmount: 400,
          time: "2024-09-28T03:47:45.509Z",
          _id: "66f77cb3f21b06959477c28b",
        },
        {
          user: {
            _id: "66f776c9cde84b9040e73889",
            name: "Shukumar Ghosh (Frontend Developer)",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocLefbDUZSjV0IpxHlc54I584NdpLnpztZ5ZXsUGOOeOqI_bITd3=s96-c",
          },
          bidAmount: 600,
          time: "2024-09-28T04:03:21.843Z",
          _id: "66f7801331caa45e3a1e599f",
        },
        {
          user: {
            _id: "66f776c9cde84b9040e73889",
            name: "Shukumar Ghosh (Frontend Developer)",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocLefbDUZSjV0IpxHlc54I584NdpLnpztZ5ZXsUGOOeOqI_bITd3=s96-c",
          },
          bidAmount: 800,
          time: "2024-09-28T04:32:18.586Z",
          _id: "66f786fbb3a5840a3fc8292e",
        },
        {
          user: {
            _id: "66f776c9cde84b9040e73889",
            name: "Shukumar Ghosh (Frontend Developer)",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocLefbDUZSjV0IpxHlc54I584NdpLnpztZ5ZXsUGOOeOqI_bITd3=s96-c",
          },
          bidAmount: 1000,
          time: "2024-09-28T04:38:05.444Z",
          _id: "66f78841b19547aa1ba0356f",
        },
        {
          user: {
            _id: "66f776c9cde84b9040e73889",
            name: "Shukumar Ghosh (Frontend Developer)",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocLefbDUZSjV0IpxHlc54I584NdpLnpztZ5ZXsUGOOeOqI_bITd3=s96-c",
          },
          bidAmount: 1200,
          time: "2024-09-28T05:19:25.946Z",
          _id: "66f791f4956a8baa1ca64753",
        },
        {
          user: {
            _id: "66f776c9cde84b9040e73889",
            name: "Shukumar Ghosh (Frontend Developer)",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocLefbDUZSjV0IpxHlc54I584NdpLnpztZ5ZXsUGOOeOqI_bITd3=s96-c",
          },
          bidAmount: 1400,
          time: "2024-09-28T05:19:25.946Z",
          _id: "66f79244956a8baa1ca6783c",
        },
        {
          user: {
            _id: "66f776c9cde84b9040e73889",
            name: "Shukumar Ghosh (Frontend Developer)",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocLefbDUZSjV0IpxHlc54I584NdpLnpztZ5ZXsUGOOeOqI_bITd3=s96-c",
          },
          bidAmount: 1600,
          time: "2024-09-28T05:19:25.946Z",
          _id: "66f79275956a8baa1ca695cb",
        },
        {
          user: {
            _id: "66f776c9cde84b9040e73889",
            name: "Shukumar Ghosh (Frontend Developer)",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocLefbDUZSjV0IpxHlc54I584NdpLnpztZ5ZXsUGOOeOqI_bITd3=s96-c",
          },
          bidAmount: 1800,
          time: "2024-09-28T05:22:27.876Z",
          _id: "66f792dd5fd34e84796125fc",
        },
        {
          user: {
            _id: "66f776c9cde84b9040e73889",
            name: "Shukumar Ghosh (Frontend Developer)",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocLefbDUZSjV0IpxHlc54I584NdpLnpztZ5ZXsUGOOeOqI_bITd3=s96-c",
          },
          bidAmount: 2000,
          time: "2024-09-28T05:22:27.876Z",
          _id: "66f792e45fd34e8479612a27",
        },
        {
          user: {
            _id: "66f776c9cde84b9040e73889",
            name: "Shukumar Ghosh (Frontend Developer)",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocLefbDUZSjV0IpxHlc54I584NdpLnpztZ5ZXsUGOOeOqI_bITd3=s96-c",
          },
          bidAmount: 2200,
          time: "2024-09-28T05:25:04.884Z",
          _id: "66f793386d4db09091af8159",
        },
        {
          user: {
            _id: "66f776c9cde84b9040e73889",
            name: "Shukumar Ghosh (Frontend Developer)",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocLefbDUZSjV0IpxHlc54I584NdpLnpztZ5ZXsUGOOeOqI_bITd3=s96-c",
          },
          bidAmount: 2400,
          time: "2024-09-28T05:30:32.497Z",
          _id: "66f7949732bb2b7dc16ce8a2",
        },
        {
          user: {
            _id: "66f776c9cde84b9040e73889",
            name: "Shukumar Ghosh (Frontend Developer)",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocLefbDUZSjV0IpxHlc54I584NdpLnpztZ5ZXsUGOOeOqI_bITd3=s96-c",
          },
          bidAmount: 2600,
          time: "2024-09-28T05:30:32.497Z",
          _id: "66f7949c32bb2b7dc16ced4c",
        },
        {
          user: {
            _id: "66f776c9cde84b9040e73889",
            name: "Shukumar Ghosh (Frontend Developer)",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocLefbDUZSjV0IpxHlc54I584NdpLnpztZ5ZXsUGOOeOqI_bITd3=s96-c",
          },
          bidAmount: 2800,
          time: "2024-09-28T05:30:32.497Z",
          _id: "66f794a932bb2b7dc16cf92e",
        },
        {
          user: {
            _id: "66f776c9cde84b9040e73889",
            name: "Shukumar Ghosh (Frontend Developer)",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocLefbDUZSjV0IpxHlc54I584NdpLnpztZ5ZXsUGOOeOqI_bITd3=s96-c",
          },
          bidAmount: 3000,
          time: "2024-09-28T05:30:32.497Z",
          _id: "66f794ac32bb2b7dc16cfc68",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 3200,
          time: "2024-09-28T05:37:43.832Z",
          _id: "66f79654eedf47805e0feab8",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 3400,
          time: "2024-09-28T05:42:24.434Z",
          _id: "66f797bec3eb37686de58a5c",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 3600,
          time: "2024-09-28T05:48:59.252Z",
          _id: "66f798fd7f42acf888837c54",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 3800,
          time: "2024-09-28T05:48:59.252Z",
          _id: "66f799017f42acf888837c8c",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 4000,
          time: "2024-09-28T05:48:59.252Z",
          _id: "66f7991f7f42acf888837d2a",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 4200,
          time: "2024-09-28T05:48:59.252Z",
          _id: "66f799217f42acf888837d60",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 4400,
          time: "2024-09-28T05:48:59.252Z",
          _id: "66f799227f42acf888837d95",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 4600,
          time: "2024-09-28T05:48:59.252Z",
          _id: "66f799687f42acf888837ea3",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 4800,
          time: "2024-09-28T05:48:59.252Z",
          _id: "66f7996d7f42acf888837ee7",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 5000,
          time: "2024-09-28T05:48:59.252Z",
          _id: "66f799bf7f42acf888837fb2",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 5200,
          time: "2024-09-28T05:48:59.252Z",
          _id: "66f799d37f42acf88883800d",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 5400,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79afe34e4756031cf89a4",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 5600,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0134e4756031cf8a05",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 5600,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0134e4756031cf8a46",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 5800,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0134e4756031cf8a6a",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 5800,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0234e4756031cf8acb",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 6000,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0234e4756031cf8af0",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 6200,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0334e4756031cf8b5f",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 6200,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0334e4756031cf8b85",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 6200,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0334e4756031cf8bf3",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 6400,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0434e4756031cf8c1e",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 6400,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0434e4756031cf8c93",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 6600,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0434e4756031cf8ce4",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 6600,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0434e4756031cf8d10",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 6600,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0434e4756031cf8d66",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 6800,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0434e4756031cf8de7",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 6800,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0534e4756031cf8e5f",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 7000,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0534e4756031cf8e91",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 7000,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0534e4756031cf8f43",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 7200,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0534e4756031cf8fa6",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 7200,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0534e4756031cf9008",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 7400,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0634e4756031cf906d",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 7400,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0634e4756031cf90a4",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 7600,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0634e4756031cf910a",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 7600,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0634e4756031cf91a7",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 7800,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0634e4756031cf9238",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 7800,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0734e4756031cf92aa",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 8000,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0734e4756031cf931a",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 8000,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0734e4756031cf938d",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 8200,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0734e4756031cf93cb",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 8200,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0734e4756031cf9441",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 8400,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0834e4756031cf94f0",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 8400,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0834e4756031cf956b",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 8600,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b0834e4756031cf9570",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 8800,
          time: "2024-09-28T05:55:56.846Z",
          _id: "66f79b3c34e4756031cf97a0",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 9000,
          time: "2024-09-28T05:59:57.801Z",
          _id: "66f79b66cf44e86e6914ecc3",
        },
        {
          user: {
            _id: "66f4f9004569f0abd53d1fc4",
            name: "Shaharul Siyam",
            profile_image:
              "https://lh3.googleusercontent.com/a/ACg8ocJyQlmetk4ZQqnn1apnSftWEICSxx1_BaLm_oKrYEGEAl0Vis8=s96-c",
          },
          bidAmount: 9200,
          time: "2024-09-28T06:02:02.342Z",
          _id: "66f79caf64f5b9d29f465a1b",
        },
      ],
      createdAt: "2024-09-25T10:54:00.821Z",
      updatedAt: "2024-09-28T06:05:35.757Z",
      __v: 59,
      currentPrice: 9200,
    });
    io.to(auctionId).emit("bidPlaced", newBid);
    // }
    // catch (error) {
    //   console.error("Error handling manual bid:", error);
    //   io.to(socket.id).emit("error", "Error placing manual bid");
    // }
  });
};

module.exports = handleManualBid;
