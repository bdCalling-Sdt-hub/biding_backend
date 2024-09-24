const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
const {
  sendImageToCloudinary,
} = require("../../../helpers/sendImageToCloudinary");
const Category = require("./category.model");

const createCategoryIntoDB = async (file, categoryData) => {
  console.log(categoryData);
  if (file) {
    const imageName = `${file?.originalname}`;
    // send image to cloudinary --------
    const { secure_url } = await sendImageToCloudinary(imageName, file?.path);
    categoryData.image = secure_url;
  }
  const result = await Category.create(categoryData);
  return result;
};

const getAllCategoryFromDB = async () => {
  const result = await Category.find();
  return result;
};

// update category into db
const updateCategoryIntoDB = async (id, image, categoryData) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category does not exits");
  }
  if (image) {
    const imageName = `${image?.originalname}`;
    // send image to cloudinary --------
    const { secure_url } = await sendImageToCloudinary(imageName, image?.path);
    categoryData.image = secure_url;
  }
  const result = await Category.findByIdAndUpdate(id, categoryData, {
    runValidators: true,
    new: true,
  });
  return result;
};

const deleteCategoryFromDB = async (id) => {
  const result = await Category.findByIdAndDelete(id);
  return result;
};

const categoryService = {
  createCategoryIntoDB,
  getAllCategoryFromDB,
  updateCategoryIntoDB,
  deleteCategoryFromDB,
};

module.exports = categoryService;
