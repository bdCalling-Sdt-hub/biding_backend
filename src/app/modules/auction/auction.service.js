const {
  sendImageToCloudinary,
} = require("../../../helpers/sendImageToCloudinary");
const Auction = require("./auction.model");

const createAuctionIntoDB = async (images, data) => {
  console.log("images", images);
  console.log("data", data);
  let imageUrls = [];
  if (images) {
    for (const image of images) {
      const imageName = image?.filename;
      const { secure_url } = await sendImageToCloudinary(
        imageName,
        image?.path
      );
      imageUrls.push(secure_url);
    }
  }
  data.images = imageUrls;
  const result = await Auction.create(data);
  return result;
};

// get all auction
const getAllAuctionFromDB = async () => {
  const result = await Auction.find();
  return result;
};

const auctionService = {
  createAuctionIntoDB,
  getAllAuctionFromDB,
};

module.exports = auctionService;
