const express = require("express");
const categoryController = require("./category.controller");

const router = express.Router();

router.post("/create-category", categoryController.createCategory);

module.exports = router;
