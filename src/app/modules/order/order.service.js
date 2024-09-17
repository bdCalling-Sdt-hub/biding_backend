const Order = require("./order.model");

const getAllOrderFromDB = async () => {
  const result = await Order.find();
  return result;
};

const orderService = {
  getAllOrderFromDB,
};

module.exports = orderService;
