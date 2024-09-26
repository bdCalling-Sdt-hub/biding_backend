const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
const {
  PrivacyPolicy,
  TermsConditions,
  Customer,
  FAQ,
  AboutUs,
  TipsAndTricks,
  Accessibility,
  Help,
} = require("./manage.model");

const createHelp = async (payload) => {
  const checkIsExist = await Help.findOne();

  if (checkIsExist) {
    return await Help.findOneAndUpdate({}, payload, {
      new: true,
      runValidators: true,
    });
  } else {
    return await Help.create(payload);
  }
};

const getHelp = async () => {
  return await Help.findOne();
};

const deleteHelp = async (id) => {
  const isExist = await Help.findById(id);

  if (!isExist) {
    throw new ApiError(404, "Help not found");
  }

  return await Help.findByIdAndDelete(id);
};

const createAccessibility = async (payload) => {
  const checkIsExist = await Accessibility.findOne();

  if (checkIsExist) {
    return await Accessibility.findOneAndUpdate({}, payload, {
      new: true,
      runValidators: true,
    });
  } else {
    return await Accessibility.create(payload);
  }
};

const getAccessibility = async () => {
  return await Accessibility.findOne();
};

const createTipsAndTricks = async (payload) => {
  const checkIsExist = await TipsAndTricks.findOne();

  if (checkIsExist) {
    return await TipsAndTricks.findOneAndUpdate({}, payload, {
      new: true,
      runValidators: true,
    });
  } else {
    return await TipsAndTricks.create(payload);
  }
};

const getTipsAndTricks = async () => {
  return await TipsAndTricks.findOne();
};

const createAboutUs = async (payload) => {
  const checkIsExist = await AboutUs.findOne();

  if (checkIsExist) {
    return await AboutUs.findOneAndUpdate({}, payload, {
      new: true,
      runValidators: true,
    });
  } else {
    return await AboutUs.create(payload);
  }
};

const getAboutUs = async () => {
  return await AboutUs.findOne();
};

const addPrivacyPolicy = async (payload) => {
  const checkIsExist = await PrivacyPolicy.findOne();

  if (checkIsExist) {
    return await PrivacyPolicy.findOneAndUpdate({}, payload, {
      new: true,
      runValidators: true,
    });
  } else {
    return await PrivacyPolicy.create(payload);
  }
};

const getPrivacyPolicy = async () => {
  return await PrivacyPolicy.findOne();
};

const deletePrivacyPolicy = async (id) => {
  const isExist = await PrivacyPolicy.findById(id);

  if (!isExist) {
    throw new ApiError(404, "Privacy Policy not found");
  }

  return await PrivacyPolicy.findByIdAndDelete(id);
};

const addTermsConditions = async (payload) => {
  const checkIsExist = await TermsConditions.findOne();

  if (checkIsExist) {
    await TermsConditions.findOneAndUpdate({}, payload, {
      new: true,
      runValidators: true,
    });

    const message = { message: "Terms & conditions updated" };

    return message;
  } else {
    return await TermsConditions.create(payload);
  }
};

const getTermsConditions = async () => {
  return await TermsConditions.findOne();
};

const deleteTermsConditions = async (id) => {
  const isExist = await TermsConditions.findById(id);

  if (!isExist) {
    throw new ApiError(404, "TermsConditions not found");
  }

  return await TermsConditions.findByIdAndDelete(id);
};

const addCustomerCare = async (payload) => {
  const isExist = await Customer.findOne({
    contactNumber: payload.contactNumber,
  });

  if (isExist) {
    throw new ApiError(400, "Already have a contact number");
  } else {
    return await Customer.create(payload);
  }
};

const getCustomerContact = async () => {
  return await Customer.findOne();
};

// faq ---
const addFaq = async (payload) => {
  return await FAQ.create(payload);
};

const getSingleFaq = async (payload) => {
  const { id } = payload;

  const faq = await FAQ.findById(id);

  if (!faq) {
    throw new ApiError(httpStatus.NOT_FOUND, "No faq found");
  }

  return faq;
};

const updateSingleFaq = async (id, payload) => {
  const existingFaq = await FAQ.findById(id);

  if (!existingFaq) {
    throw new ApiError(httpStatus.NOT_FOUND, "No faq found");
  }

  const faq = await FAQ.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return faq;
};

const deleteSingleFaq = async (id) => {
  const isExist = await FAQ.findById(id);
  if (!isExist) {
    throw new ApiError(404, "Faq not found");
  }
  return await FAQ.findByIdAndDelete(id);
};

const ManageService = {
  createHelp,
  getHelp,
  deleteHelp,
  createAccessibility,
  getAccessibility,
  createTipsAndTricks,
  getTipsAndTricks,
  createAboutUs,
  getAboutUs,
  addPrivacyPolicy,
  addTermsConditions,
  getPrivacyPolicy,
  getTermsConditions,
  deletePrivacyPolicy,
  deleteTermsConditions,
  addCustomerCare,
  getCustomerContact,
  addFaq,
  getSingleFaq,
  updateSingleFaq,
  deleteSingleFaq,
};

module.exports = { ManageService };
