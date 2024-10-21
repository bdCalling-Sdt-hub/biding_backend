const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
const Order = require("./order.model");
const QueryBuilder = require("../../../builder/QueryBuilder");
const { Transaction } = require("../payment/payment.model");
const cron = require("node-cron");
const {
  ENUM_ITEM_TYPE,
  ENUM_PAYMENT_STATUS,
  ENUM_ORDER_TYPE,
  ENUM_PAID_BY,
  ENUM_DELIVERY_STATUS,
} = require("../../../utils/enums");
const Auction = require("../auction/auction.model");
const Notification = require("../notification/notification.model");
const isStatusTransitionValid = require("./order.utils");

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

  const currentStatus = order.status;

  // Validate if the status transition is allowed
  if (!isStatusTransitionValid(currentStatus, status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot change status from ${currentStatus} to ${status}`
    );
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

// create finance order ----------------------------
const createFinanceOrder = async (userId, orderDetails) => {
  const isExistFinanceOrder = await Order.findOne({
    item: orderDetails?.product,
  });
  if (isExistFinanceOrder) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You already make finance order for this product , please wait for response"
    );
  }
  if (!orderDetails?.shippingAddress) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Please add shipping address");
  }
  const isValidProduct = await Auction.findOne({
    "winingBidder.user": userId,
    // currentPrice: orderDetails.totalAmount,
  });

  if (!isValidProduct) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You should win the bid for buy this product"
    );
  }

  const auction = await Auction.findById(orderDetails?.product).select(
    "totalMonthForFinance currentPrice"
  );
  const totalMonth = auction.totalMonthForFinance;
  const monthlyAmount = auction.currentPrice / totalMonth;

  const fiveDaysFromNow = new Date();
  fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
  const orderData = {
    user: userId,
    shippingAddress: orderDetails?.shippingAddress,
    winingBid: auction?.currentPrice,
    totalAmount: auction?.currentPrice,
    paidBy: ENUM_PAID_BY.OTHER,
    productName: orderDetails?.item,
    item: orderDetails?.product,
    status: ENUM_DELIVERY_STATUS.PAYMENT_PENDING,
    statusWithTime: [
      {
        status: ENUM_DELIVERY_STATUS.PAYMENT_PENDING,
        time: new Date(),
      },
    ],
    // new features
    expectedDeliveryData: fiveDaysFromNow,
    monthlyAmount: monthlyAmount,
    totalMonth: totalMonth,
    orderType: ENUM_ORDER_TYPE.FINANCE,
    dueAmount: auction.currentPrice,
    paidInstallment: 0,
    installmentLeft: totalMonth,
    monthlyStatus: "due",
    //
    customerName: orderDetails.customerName,
    customerEmail: orderDetails.customerEmail,
    customerPhoneNum: orderDetails.customerPhoneNum,
    customerAddress: orderDetails.customerAddress,
    isApproved: false,
  };
  const order = await Order.create(orderData);

  return order;
};

const approveFinanceOrder = async (id) => {
  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Finance order not found");
  }

  const result = await Order.findByIdAndUpdate(
    id,
    {
      isApproved: true,
    },
    { new: true, runValidators: true }
  );
  return result;
};

const declineFinanceOrder = async (id) => {
  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Finance order not found");
  }

  const result = await Order.findByIdAndDelete(id);

  const notificationData = {
    title: "Your finance order request has been rejected",
    message: `Your finance order request has been rejected , please contact our support `,
    receiver: order.user,
  };
  await Notification.create(notificationData);

  return result;
};

const makePaid = async (id) => {
  const order = await Order.findById(id).select(
    "paidInstallment installmentLeft dueAmount monthlyAmount"
  );
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Finance order not found");
  }
  if (order.installmentLeft === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No installment left");
  }

  const result = await Order.findByIdAndUpdate(
    id,
    {
      paidInstallment: order.paidInstallment + 1,
      installmentLeft: order.installmentLeft - 1,
      dueAmount: order.dueAmount - order.monthlyAmount,
      lastPayment: new Date(),
      monthlyStatus: "paid",
    },
    { new: true, runValidators: true }
  );
  return result;
};

//
const sendPaymentLink = async (id, paymentLink) => {
  const order = await Order.findById(id);
  if (!order.isApproved) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "The order was not found, or you didn't approve it"
    );
  }
  const result = await Order.findByIdAndUpdate(
    id,
    { paymentLink: paymentLink },
    {
      new: true,
      runValidators: true,
    }
  );
  return result;
};

// crone jobs

// Schedule a cron job to run at midnight on the second day of every month--------------
cron.schedule("0 0 2 * *", async () => {
  try {
    console.log("Running monthly due check...");

    // Get the current month start and end
    const startOfMonth = moment().startOf("month").toDate();
    const endOfMonth = moment().endOf("month").toDate();

    // Find all orders where:
    // 1. `installmentLeft` is not 0
    // 2. `lastPayment` is not in this month
    const orders = await Order.find({
      installmentLeft: { $ne: 0 },
      lastPayment: { $not: { $gte: startOfMonth, $lte: endOfMonth } },
    });

    // Update each order's `monthlyStatus` to "due"
    await Promise.all(
      orders.map(async (order) => {
        order.monthlyStatus = "due";
        await order.save();
      })
    );
  } catch (error) {
    console.error("Error during monthly due check:", error);
  }
});

// This cron job runs every hour
cron.schedule("*/5 * * * *", async () => {
  try {
    // Get the time that is 10 minutes ago from now
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // Query to delete orders that match the criteria
    const result = await Order.deleteMany({
      status: "pending",
      createdAt: { $lte: tenMinutesAgo },
      orderType: { $ne: ENUM_ORDER_TYPE.FINANCE },
    });

    console.log(`${result.deletedCount} orders deleted.`);
  } catch (error) {
    console.error("Error running the cron job:", error);
  }
});

const orderService = {
  getAllOrderFromDB,
  getMyOrderFromDB,
  getSingleOrder,
  changeOrderStatusIntoDB,
  updateExpectedDeliveryDateIntoDB,
  getMyBids,
  createFinanceOrder,
  approveFinanceOrder,
  makePaid,
  declineFinanceOrder,
  sendPaymentLink,
};

module.exports = orderService;
