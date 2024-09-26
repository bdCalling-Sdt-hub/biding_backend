const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
const User = require("../user/user.model");
const Shipping = require("./shipping.model");
const QueryBuilder = require("../../../builder/QueryBuilder");

const createShippingAddress = async (userId, payload) => {
  const result = await Shipping.create({ ...payload, user_id: userId });
  return result;
};

const getMyShippingAddress = async (userId) => {
  const result = await Shipping.find({ user_id: userId });
  return result;
};

const getAllShipping = async (query) => {
  const shippingsQuery = new QueryBuilder(Shipping.find(), query)
    .search(["name"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await shippingsQuery.modelQuery;
  const meta = await shippingsQuery.countTotal();

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "No shippings found");
  }

  return { meta, result };
};

const getSingleShipping = async (id) => {
  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing shipping ID");
  }

  const result = await Shipping.findById(id);

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "No shippings found");
  }

  return result;
};

const getSpecificUserShipping = async (payload, query) => {
  const { user_id } = payload;

  if (!user_id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing user_id");
  }

  const shippingsQuery = new QueryBuilder(Shipping.find({ user_id }), query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await shippingsQuery.modelQuery;
  const meta = await shippingsQuery.countTotal();

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "No shippings found");
  }

  return { meta, result };
};
const updateShippingAddress = async (payload, id) => {
  if (!payload || !id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing shipping id");
  }

  const existingShipping = await Shipping.findById(id);

  if (!existingShipping) {
    throw new ApiError(httpStatus.NOT_FOUND, "No shippings found");
  }

  const updatedShipping = await Shipping.findByIdAndUpdate(
    { _id: id },
    { ...payload },
    { new: true, runValidators: true }
  );

  return updatedShipping;
};

const ShippingService = {
  createShippingAddress,
  getAllShipping,
  getMyShippingAddress,
  getSingleShipping,
  getSpecificUserShipping,
  updateShippingAddress,
};

module.exports = ShippingService;
