const express = require("express");
const routes = express.Router();
const Joi = require("@hapi/joi");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const Company = require("../models/companySignupSchema");
const Jobs = require("../models/createJobsSchema");
const auth = require("../middleware/auth");
const ApplyJobs = require("../models/jobApplyingSchema");

// JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || config.get("JWT_SECRET");

// @route GET
// @desc getting jobs
// @access private
routes.get("/jobs", auth.companyAuth, async (req, res) => {
  const company = await Company.findOne({ _id: req.company._id });
  const jobApplications = await ApplyJobs.find({ createdFor: req.company._id });
  try {
    let _id = company._id;
    let companyJobs = await Jobs.find({ createdBy: _id });

    // sending response
    return res.status(200).send({
      success: true,
      message: "total jobs",
      jobs: companyJobs,
      jobApplications
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error"
    });
  }
});


// @route GET
// @desc specific student info
// @access private
routes.get("/profile", auth.companyAuth, async(req, res) => {
  try {
    
    const companyProfile = await Company.findById(
      { _id: req.company._id },
      { password: 0 }
    );

    if (!companyProfile) {
      return res.status(400).send({
        success: false,
        message: "No company found!"
      });
    }

    return res.status(200).send({
      success: false,
      companyProfile
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Internal server error"
    });
  }
});


// @route POST
// @desc company login
// @access public
const postApiParamsSchema = Joi.object({
  password: Joi.string()
    .min(8)
    .required(),
  email: Joi.string().required()
});
routes.post("/login", async (req, res) => {
  let { email, password } = req.body;
  if (!email) {
    return res.status(400).send({
      success: false,
      message: "Please enter the email address"
    });
  }
  email = email.toLowerCase();
  email = email.trim();
  // validating api params
  const { error } = postApiParamsSchema.validate({
    password,
    email
  });
  if (error) {
    return res.status(400).send({
      success: false,
      message: error.details[0].message
    });
  }

  try {
    const company = await Company.findOne({ email });

    if (!company) {
      return res.status(400).send({
        success: false,
        message: "login failed check your email"
      });
    }

    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch) {
      return res.status(400).send({
        success: false,
        message: "Invalid Password"
      });
    }

    // creating jsonwebtoken
    const payload = {
      company: {
        email: company.email,
        _id: company._id
      }
    };

    const token = jwt.sign(payload, JWT_SECRET);

    return res.status(200).send({
      success: true,
      message: "Company logged-in successfully",
      company,
      token
    });
  } catch (error) {
    return res.send(500).send({
      success: false,
      message: "Internal server error"
    });
  }
});

// @route POST
// @desc company sign-up
// @access PUBLIC
const apiParamsSchema = Joi.object({
  companyName: Joi.string().required(),
  email: Joi.string().required(),
  password: Joi.string()
    .min(8)
    .required(),
  buisnessPhoneNumber: Joi.number().required(),
  buisnessDetails: Joi.string().required(),
  companyAddress: Joi.string().required(),
  city: Joi.string().required()
});

routes.post("/signup", async (req, res) => {
  let {
    companyName,
    email,
    password,
    buisnessPhoneNumber,
    buisnessDetails,
    companyAddress,
    city
  } = req.body;

  if (!email) {
    return res.status(400).send({
      success: false,
      message: "PLease fill the email"
    });
  }

  email = email.toLowerCase();
  email = email.trim();
  // email typo error checking
  const emailSplit = email.split("@");
  if (emailSplit.length < 2 || emailSplit.length > 2) {
    return res.status(400).send({
      success: false,
      message: "Incorrect format of Email"
    });
  }

  try {
    const isCompanyExists = await Company.findOne({ email });
    if (isCompanyExists) {
      return res.status(400).send({
        success: false,
        message: "Email already existed"
      });
    }

    const { error } = apiParamsSchema.validate({
      companyAddress,
      companyName,
      email,
      password,
      city,
      buisnessDetails,
      buisnessPhoneNumber
    });

    
    // error checking before registering any company
    if (error) {
      return res.status(400).send({
        success: false,
        message: error.details[0].message
      });
    }

    // checking whitespace
    companyName = companyName.trim();
    companyAddress = companyAddress.trim();
    city = city.trim();
    buisnessDetails = buisnessDetails.trim();

    const crossCheck = apiParamsSchema.validate({
      companyAddress,
      companyName,
      email,
      password,
      city,
      buisnessDetails,
      buisnessPhoneNumber
    });
    if (crossCheck.error) {
      return res.status(400).send({
        success: false,
        message: crossCheck.error.details[0].message
      });
    }

    // checking the type of entered buisness phone number
    if (typeof buisnessPhoneNumber !== "number") {
      return res.status(400).send({
        success: false,
        message: "Enter the valid phone number"
      });
    }

    password = password.trim();
    // checking if the space is present in given email or password or not
    const spaceInPasswordCheck = password.split(" ");
    if (spaceInPasswordCheck.length > 1) {
      return res.status(400).send({
        success: false,
        message: "Space is not allowed in Password"
      });
    }

    const spaceInEmailCheck = email.split(" ");
    if (spaceInEmailCheck.length > 1) {
      return res.status(400).send({
        success: false,
        message: "Space is not allowed in Email"
      });
    }

    // adding company to the database
    const company = await new Company({
      companyName,
      email,
      password,
      buisnessPhoneNumber,
      buisnessDetails,
      companyAddress,
      city
    });

    // hashing the password

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    company.password = hash;

    await company.save();

    // generating json-web-token
    const payload = {
      company: {
        email: email,
        _id: company.id
      }
    };

    const token = await jwt.sign(payload, JWT_SECRET, {
      expiresIn: "365d"
    });

    return res.status(200).send({
      success: true,
      message: "Student registered Successfully",
      token,
      company
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      error: "Internal server error"
    });
  }
});

module.exports = routes;
