const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
const {
  sendImageToCloudinary,
} = require("../../../helpers/sendImageToCloudinary");
const Category = require("./category.model");

const createCategoryIntoDB = async (categoryData) => {
  const result = await Category.create(categoryData);
  return result;
};

const getAllCategoryFromDB = async () => {
  const result = await Category.find();
  return result;
};

// update category into db
const updateCategoryIntoDB = async (id, categoryData) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category does not exits");
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
