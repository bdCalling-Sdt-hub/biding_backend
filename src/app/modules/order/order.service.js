const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
const Order = require("./order.model");
const QueryBuilder = require("../../../builder/QueryBuilder");
const { Transaction } = require("../payment/payment.model");
const { ENUM_ITEM_TYPE, ENUM_PAYMENT_STATUS } = require("../../../utils/enums");

const getAllOrderFromDB = async (query) => {
  // let query = {};
  // if (query?.searchTerm) {
  //   query = {};
  // }
  const orderQuery = new QueryBuilder(Order.find(), query)
    .search(["name", "item.name"])
    .filter()
    .sort()
    .paginate()
    .fields();
  orderQuery.modelQuery = orderQuery.modelQuery
    .populate("user", "name email profile_image")
    .populate({
      path: "item",
      model: "Auction",
      select: "name images currentPrice",
    })
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
  const result = Order.findById(id)
    .populate("user")
    .populate("item")
    .populate("shippingAddress");
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
    {
      status: status,
      $push: { statusWithTime: { status, time: new Date() } },
    },
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

const getMyBids = async (userId) => {
  const bids = await Transaction.find({
    user: userId,
    itemType: ENUM_ITEM_TYPE.BID,
    paymentStatus: ENUM_PAYMENT_STATUS.PAID,
  });
  const totalBid = bids.reduce((sum, bid) => sum + bid.totalBid, 0);

  return {
    bids,
    totalBid,
  };
};

const orderService = {
  getAllOrderFromDB,
  getMyOrderFromDB,
  getSingleOrder,
  changeOrderStatusIntoDB,
  updateExpectedDeliveryDateIntoDB,
  getMyBids,
};

module.exports = orderService;
