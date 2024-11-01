const config = require("../../../config");
const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const categoryService = require("./category.service");

const createCategory = catchAsync(async (req, res) => {
  const { files } = req;

  // Check if files and store_image exist, and process multiple images
  if (files && typeof files === "object" && "category_image" in files) {
    req.body.image = `${config.image_url}${files["category_image"][0].path}`;
  }

  const result = await categoryService.createCategoryIntoDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Category created successfully",
    data: result,
  });
});
// get all category
const getAllCategory = catchAsync(async (req, res) => {
  const result = await categoryService.getAllCategoryFromDB(req.file, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category retrieved successfully",
    data: result,
  });
});

// update category
const updateCategory = catchAsync(async (req, res) => {
  const { files } = req;

  // Check if files and store_image exist, and process multiple images
  if (files && typeof files === "object" && "category_image" in files) {
    req.body.image = `${config.image_url}${files["category_image"][0].path}`;
  }
  const result = await categoryService.updateCategoryIntoDB(
    req.params?.id,
    req.body
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category updated successfully",
    data: result,
  });
});
// delete category
const deleteCategory = catchAsync(async (req, res) => {
  const result = await categoryService.deleteCategoryFromDB(req.params?.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category deleted successfully",
    data: result,
  });
});
const categoryController = {
  createCategory,
  getAllCategory,
  updateCategory,
  deleteCategory,
};

module.exports = categoryController;
