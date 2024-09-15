const {
  sendImageToCloudinary,
} = require("../../../utils/sendImageToCloudinary");
const Category = require("./category.model");

const createCategoryIntoDB = async (file, categoryData) => {
  if (file) {
    const imageName = `${categoryData?.name}`;

    // send image to cloudinary --------
    const { secure_url } = await sendImageToCloudinary(imageName, file?.path);
    categoryData?.image = secure_url;
  }
  const result = await Category.create(categoryData)
  return result

};


const categoryService = {
    createCategoryIntoDB
}

module.exports = categoryService;
