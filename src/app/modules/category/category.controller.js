const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const categoryService = require("./category.service");

const createCategory = catchAsync(async (req, res) => {
  const result = await categoryService.createCategoryIntoDB(req.file, req.body);

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

const categoryController = {
  createCategory,
  getAllCategory,
};

module.exports = categoryController;
