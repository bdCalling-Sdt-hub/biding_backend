const mongoose = require("mongoose");
const { model } = require("mongoose");

//! help
const helpSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

//! Privacy and policy
const privacySchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

//! About US
const aboutUsSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

//! Terms Conditions
const termsAndConditionsSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

//!Contact US
const contactUsSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    phone_number: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

//!FAQ
const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
      unique: [true, "Question must be unique"],
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

//!Slider
const sliderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const customerSchema = new mongoose.Schema(
  {
    contactUs: {
      type: String,
      trim: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const tipsAndTricksSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const accessibilitySchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = {
  Help: model("help", helpSchema),
  PrivacyPolicy: model("PrivacyPolicy", privacySchema),
  TermsConditions: model("TermsConditions", termsAndConditionsSchema),
  Customer: model("Customer", customerSchema),
  TipsAndTricks: model("TipsAndTricks", tipsAndTricksSchema),
  Accessibility: model("Accessibility", accessibilitySchema),
  AboutUs: model("AboutUs", aboutUsSchema),
  ContactUs: model("ContactUs", contactUsSchema),
  FAQ: model("FAQ", faqSchema),
  Slider: model("Slider", sliderSchema),
};
