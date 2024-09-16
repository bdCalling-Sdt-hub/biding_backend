const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
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

// get single auction
const getSingleAuctionFromDB = async (id) => {
  const result = await Auction.findById(id);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Auction not found");
  }
  return result;
};

// update auction into db
const updateAuctionIntoDB = async (id, newImages, data) => {
  const auction = await Auction.findById(id);
  if (!auction) {
    throw new ApiError(httpStatus.NOT_FOUND, "Auction not found");
  }
  let imageUrls = [...data?.images];
  if (newImages) {
    for (const image of newImages) {
      const imageName = image?.filename;
      const { secure_url } = await sendImageToCloudinary(
        imageName,
        image?.path
      );
      imageUrls.push(secure_url);
    }
  }

  data.images = imageUrls;
  const result = await Auction.findByIdAndUpdate(id, data, {
    runValidators: true,
    new: true,
  });
  return result;
};

// delete auction from db
const deleteAuctionFromDB = async (id) => {
  const result = await Auction.findByIdAndDelete(id);
  return result;
};

const auctionService = {
  createAuctionIntoDB,
  getAllAuctionFromDB,
  updateAuctionIntoDB,
  deleteAuctionFromDB,
  getSingleAuctionFromDB,
};

module.exports = auctionService;
