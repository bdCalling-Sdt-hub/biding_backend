const { ENUM_DELIVERY_STATUS } = require("../../../utils/enums");

// Define the allowed status transitions
const ALLOWED_STATUS_TRANSITIONS = {
  [ENUM_DELIVERY_STATUS.PAYMENT_PENDING]: [
    ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
  ],
  [ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS]: [ENUM_DELIVERY_STATUS.PROCESSING],
  [ENUM_DELIVERY_STATUS.PROCESSING]: [ENUM_DELIVERY_STATUS.SHIPPED],
  [ENUM_DELIVERY_STATUS.SHIPPED]: [ENUM_DELIVERY_STATUS.DELIVERED],
};

// Function to validate if the status change is allowed
const isStatusTransitionValid = (currentStatus, newStatus) => {
  const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
};

module.exports = isStatusTransitionValid;
