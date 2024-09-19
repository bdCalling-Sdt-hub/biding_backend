const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
const Order = require("./order.model");

const getAllOrderFromDB = async () => {
  const result = await Order.find();
  return result;
};

// get single order
const getSingleOrder = async (id) => {
  const result = Order.findById(id);
  return result;
};

// get my orders
const getMyOrderFromDB = async (userId) => {
  const result = await Order.find({ user: userId });
  return result;
};

const changeOrderStatusIntoDB = async (id, status) => {
  console.log(status);
  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "This order does not exists");
  }
  const result = await Order.findByIdAndUpdate(
    id,
    { status: status },
    { runValidators: true, new: true }
  );
  return result;
};

const orderService = {
  getAllOrderFromDB,
  getMyOrderFromDB,
  getSingleOrder,
  changeOrderStatusIntoDB,
};

module.exports = orderService;
