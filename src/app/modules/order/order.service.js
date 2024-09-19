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
  // const result = await Order.findByIdAndUpdate(id, { status: status });
  // return result;
};

const orderService = {
  getAllOrderFromDB,
  getMyOrderFromDB,
  getSingleOrder,
  changeOrderStatusIntoDB,
};

module.exports = orderService;
