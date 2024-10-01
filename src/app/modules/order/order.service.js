const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
const Order = require("./order.model");
const QueryBuilder = require("../../../builder/QueryBuilder");

const getAllOrderFromDB = async (query) => {
  const orderQuery = new QueryBuilder(Order.find(), query)
    .search(["name"])
    .filter()
    .sort()
    .paginate()
    .fields();
  orderQuery.modelQuery = orderQuery.modelQuery
    .populate("user")
    .populate("item")
    .populate("shippingAddress");

  const result = await orderQuery.modelQuery;
  const meta = await orderQuery.countTotal();
  // const result = await Order.find()
  //   .populate("user")
  //   .populate("item")
  //   .populate("shippingAddress");
  return { meta, result };
};

// get single order
const getSingleOrder = async (id) => {
  const result = Order.findById(id);
  return result;
};

// get my orders
const getMyOrderFromDB = async (userId, query) => {
  // const result = await Order.find({ user: userId });
  // return result;
  const orderQuery = new QueryBuilder(Order.find({ user: userId }), query)
    .search(["name"])
    .filter()
    .sort()
    .paginate()
    .fields();
  orderQuery.modelQuery = orderQuery.modelQuery
    .populate("user")
    .populate("item")
    .populate("shippingAddress");

  const result = await orderQuery.modelQuery;
  const meta = await orderQuery.countTotal();
  // const result = await Order.find()
  //   .populate("user")
  //   .populate("item")
  //   .populate("shippingAddress");
  return { meta, result };
};

const changeOrderStatusIntoDB = async (id, status) => {
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

// update expected delivery data
const updateExpectedDeliveryDateIntoDB = async (id, date) => {
  const result = await Order.findByIdAndUpdate(
    id,
    { expectedDeliveryData: data },
    { runValidators: true, new: true }
  );
  return result;
};

const orderService = {
  getAllOrderFromDB,
  getMyOrderFromDB,
  getSingleOrder,
  changeOrderStatusIntoDB,
  updateExpectedDeliveryDateIntoDB,
};

module.exports = orderService;
