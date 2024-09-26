const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
const User = require("../user/user.model");
const Shipping = require("./shipping.model");
const QueryBuilder = require("../../../builder/QueryBuilder");

const createShipping = async (payload) => {
  if (!payload) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Request body does not exist");
  }

  const { user_id } = payload;

  const existingUser = await User.findById(user_id);
  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  return await Shipping.create(payload);
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
  createShipping,
  getAllShipping,
  getSingleShipping,
  getSpecificUserShipping,
  updateShippingAddress,
};

module.exports = ShippingService;
