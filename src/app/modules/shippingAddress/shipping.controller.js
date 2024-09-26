const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const ShippingService = require("./shipping.service");

const createShippingAddress = catchAsync(async (req, res) => {
  const result = await ShippingService.createShippingAddress(
    req?.user?.userId,
    req.body
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Shipping  address created successfully",
    data: result,
  });
});
const getMyShippingAddress = catchAsync(async (req, res) => {
  const result = await ShippingService.getMyShippingAddress(req?.user?.userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Shipping address retrieved successfully",
    data: result,
  });
});

const getAllShipping = catchAsync(async (req, res) => {
  const result = await ShippingService.getAllShipping(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Shipment retrieved successfully",
    data: result,
  });
});

const getSingleShipping = catchAsync(async (req, res) => {
  const result = await ShippingService.getSingleShipping(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Shipment retrieved successfully",
    data: result,
  });
});

const getSpecificUserShipping = catchAsync(async (req, res) => {
  const result = await ShippingService.getSpecificUserShipping(
    req.body,
    req.query
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Shipment retrieved successfully",
    data: result,
  });
});

const updateShippingAddress = catchAsync(async (req, res) => {
  const result = await ShippingService.updateShippingAddress(
    req.body,
    req.params.id
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Shipping address updated successfully",
    data: result,
  });
});

const ShippingController = {
  createShippingAddress,
  getAllShipping,
  getMyShippingAddress,
  getSingleShipping,
  getSpecificUserShipping,
  updateShippingAddress,
};

module.exports = ShippingController;
