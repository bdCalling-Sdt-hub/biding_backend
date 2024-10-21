const config = require("../../config");
const Admin = require("../modules/admin/admin.model");

const adminUser = {
  name: "Manik Sarker",
  email: "maniksarker265@gmail.com",
  phone_number: "1234567890",
  password: config.default_admin_password,
  role: "ADMIN",
  streetAddress: "123 Admin Street",
  city: "Admin City",
  state: "Admin State",
  zipCode: 12345,
  profile_image:
    "https://st3.depositphotos.com/15648834/17930/v/450/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg",
};

const seedAdmin = async () => {
  try {
    // Check if an admin already exists
    const adminExists = await Admin.findOne({ role: "ADMIN" });

    if (!adminExists) {
      // If no admin exists, create the new admin user
      const newAdmin = new Admin(adminUser);
      await newAdmin.save();
      console.log("Admin user created successfully.");
    } else {
      console.log("Admin user already exists.");
    }
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
};

module.exports = seedAdmin;
