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

const orderService = {
  getAllOrderFromDB,
  getMyOrderFromDB,
  getSingleOrder,
};

module.exports = orderService;
