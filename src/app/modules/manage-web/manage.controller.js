const { ManageService } = require("./manage.service");
const sendResponse = require("../../../shared/sendResponse");
const catchAsync = require("../../../shared/catchasync");

const createHelp = catchAsync(async (req, res) => {
  const result = await ManageService.createHelp(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful",
    data: result,
  });
});

const getHelp = catchAsync(async (req, res) => {
  const result = await ManageService.getHelp();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful",
    data: result,
  });
});

const deleteHelp = catchAsync(async (req, res) => {
  const result = await ManageService.deleteHelp(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful",
    data: result,
  });
});

const createAccessibility = catchAsync(async (req, res) => {
  const result = await ManageService.createAccessibility(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful",
    data: result,
  });
});

const getAccessibility = catchAsync(async (req, res) => {
  const result = await ManageService.getAccessibility();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful",
    data: result,
  });
});
const createTipsAndTricks = catchAsync(async (req, res) => {
  const result = await ManageService.createTipsAndTricks(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful",
    data: result,
  });
});

const getTipsAndTricks = catchAsync(async (req, res) => {
  const result = await ManageService.getTipsAndTricks();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful",
    data: result,
  });
});

const createAboutUs = catchAsync(async (req, res) => {
  const result = await ManageService.createAboutUs(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful",
    data: result,
  });
});

const getAboutUs = catchAsync(async (req, res) => {
  const result = await ManageService.getAboutUs();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful",
    data: result,
  });
});

const addPrivacyPolicy = catchAsync(async (req, res) => {
  const result = await ManageService.addPrivacyPolicy(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful",
    data: result,
  });
});

const addTermsConditions = catchAsync(async (req, res) => {
  const result = await ManageService.addTermsConditions(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful",
    data: result.message ? result.message : result,
  });
});

const getPrivacyPolicy = catchAsync(async (req, res) => {
  const result = await ManageService.getPrivacyPolicy();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful",
    data: result,
  });
});

const getTermsConditions = catchAsync(async (req, res) => {
  const result = await ManageService.getTermsConditions();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful",
    data: result,
  });
});

const deletePrivacyPolicy = catchAsync(async (req, res) => {
  const result = await ManageService.deletePrivacyPolicy(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful",
    data: result,
  });
});

const deleteTermsConditions = catchAsync(async (req, res) => {
  const result = await ManageService.deleteTermsConditions(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Deletion Successful",
    data: result,
  });
});

const addCustomerCare = catchAsync(async (req, res) => {
  const result = await ManageService.addCustomerCare(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful",
    data: result,
  });
});

const getCustomerContact = catchAsync(async (req, res) => {
  const result = await ManageService.getCustomerContact();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful",
    data: result,
  });
});

// faq ---
const addFaq = catchAsync(async (req, res) => {
  const result = await ManageService.addFaq(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful",
    data: result,
  });
});

const getSingleFaq = catchAsync(async (req, res) => {
  const result = await ManageService.getSingleFaq(req.params);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful",
    data: result,
  });
});

const updateSingleFaq = catchAsync(async (req, res) => {
  const result = await ManageService.updateSingleFaq(req.params.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful",
    data: result,
  });
});

const deleteSingleFaq = catchAsync(async (req, res) => {
  const result = await ManageService.deleteSingleFaq(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful",
    data: result,
  });
});

const ManageController = {
  createHelp,
  getHelp,
  deleteHelp,
  createAccessibility,
  getAccessibility,
  createTipsAndTricks,
  getTipsAndTricks,
  addPrivacyPolicy,
  addTermsConditions,
  getPrivacyPolicy,
  getTermsConditions,
  deletePrivacyPolicy,
  deleteTermsConditions,
  getCustomerContact,
  addCustomerCare,
  addFaq,
  getSingleFaq,
  updateSingleFaq,
  deleteSingleFaq,
  createAboutUs,
  getAboutUs,
};

module.exports = { ManageController };
