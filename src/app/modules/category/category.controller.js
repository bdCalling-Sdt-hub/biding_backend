const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const categoryService = require("./category.service");

const createCategory = catchAsync(async (req, res) => {
  const result = await categoryService.createCategoryIntoDB(req.file, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category created successfully",
    data: result,
  });
});

const categoryController = {
  createCategory,
};

module.exports = categoryController;
