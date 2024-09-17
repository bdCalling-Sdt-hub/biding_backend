// get all order
const getAllOrder = catchAsync(async (req, res) => {
  const result = await categoryService.getAllCategoryFromDB();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Order retrieved successfully",
    data: result,
  });
});

const orderController = {
  getAllOrder,
};

module.exports = orderController;
