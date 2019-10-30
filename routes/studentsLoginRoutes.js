const express = require("express");
const routes = express.Router();
const Joi = require("@hapi/joi");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const Student = require("../models/studentSignupSchema");
const Company = require("../models/companySignupSchema");
const Jobs = require("../models/createJobsSchema");
const auth = require("../middleware/auth");
const ApplyJobs = require("../models/jobApplyingSchema");

// JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || config.get("JWT_SECRET");

// Authentication of Students input fields
const apiParamsSchema = Joi.object({
  studentName: Joi.string().required(),
  fatherName: Joi.string().required(),
  password: Joi.string()
    .min(8)
    .required(),
  collegeName: Joi.string().required(),
  majors: Joi.array().required(),
  gender: Joi.string().required()
});

// @route GET
// @desc getting jobs
// @access private
routes.get("/jobs", auth.studentAuth, async (req, res) => {
  const companies = await Company.find({});
  const appliedJobs = await ApplyJobs.find({ createdBy: req.student._id });

  try {
    // getting jobs
    let totalJobs = [];
    // filtering each company created jobs
    for (let i = 0; i < companies.length; i++) {
      let count = 0;
      let _id = companies[i]._id;
      let eachCompanyJobs = await Jobs.find({ createdBy: _id }).populate(
        "createdBy",
        { password: 0 }
      );
      // filtering companies who haven't applied for job yet
      let keys = Object.keys(eachCompanyJobs);
      if (keys.length !== 0) {
        let jobsArray = {
          companyName: eachCompanyJobs[count].createdBy.companyName,
          totalJobs: eachCompanyJobs
        };
        totalJobs.push(jobsArray);
        count++;
      }
    }

    // sending response
    return res.status(200).send({
      success: true,
      message: "total jobs",
      totalJobs,
      appliedJobs
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error"
    });
  }
});



// @route GET 
// @desc fetching companies
// @access private
routes.get('/companies', auth.studentAuth, async (req, res) => {
  try {
    const companies = await Company.find({});
        if(!companies){
          res.status(400).send({
            success: false,
            message: "No Company Found"
          })
        }
    return res.status(200).send({
      success: true,
      companies
    })
  } catch (error) {
      res.status(500).send({
        success: false,
        message: 'Internal Server Error'
      })    
  }    
      
})


// @route GET
// @desc specific student info
// @access private
routes.get("/profile", auth.studentAuth, async(req, res) => {
  try {
    
    const studentProfile = await Student.findById(
      { _id: req.student._id },
      { password: 0 }
    );

    if (!studentProfile) {
      return res.status(400).send({
        success: false,
        message: "No student found!"
      });
    }

    return res.status(200).send({
      success: false,
      studentProfile
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Internal server error"
    });
  }
});

// @route POST
// @desc student signup
// @access Public
routes.post("/signup", async (req, res) => {
  let {
    studentName,
    fatherName,
    password,
    collegeName,
    majors,
    email,
    gender
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
  if (emailSplit.length < 2) {
    return res.status(400).send({
      success: false,
      message: "Incorrect format of Email"
    });
  }

  try {
    // checking whether the email is already existed in the database or not
    const isStudentExist = await Student.findOne({ email });
    if (isStudentExist) {
      return res.status(400).send({
        success: false,
        message: "Email already existed"
      });
    }

    if (!studentName) {
      return res.status(400).send({
        success: false,
        message: '"studentName" is not allowed to be empty'
      });
    } else if (!fatherName) {
      return res.status(400).send({
        success: false,
        message: '"fatherName" is not allowed to be empty'
      });
    } else if (!collegeName) {
      return res.status(400).send({
        success: false,
        message: '"collegeName" is not allowed to be empty'
      });
    }
    // whitespace checking
    studentName = studentName.trim();
    fatherName = fatherName.trim();
    collegeName = collegeName.trim();

    const { error } = apiParamsSchema.validate({
      studentName,
      fatherName,
      password,
      collegeName,
      majors,
      gender
    });
    // error checking before registering any student
    if (error) {
      return res.status(400).send({
        success: false,
        message: error.details[0].message
      });
    }
    // checking if the major courses field is filled or not
    if (majors.length < 1) {
      return res.status(400).send({
        success: false,
        message: "Please select your major course"
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

    const student = await new Student({
      studentName,
      fatherName,
      password,
      email,
      majors,
      collegeName,
      gender
    });

    // hashing the password of student
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    student.password = hash;

    // saving student to database
    await student.save();

    // creating jsonwebtoken
    const payload = {
      student: {
        email,
        _id: student.id
      }
    };

    const token = await jwt.sign(payload, JWT_SECRET, {
      expiresIn: "365d"
    });

    return res.status(200).send({
      success: true,
      message: "Student registered Successfully",
      token,
      student
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error: "Internal server error"
    });
  }
});

// @route POST
// @desc student login
// @access Public
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
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(400).send({
        success: false,
        message: "login failed check your email"
      });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(400).send({
        success: false,
        message: "Invalid Password"
      });
    }

    // creating jsonwebtoken
    const payload = {
      student: {
        email: student.email,
        _id: student._id
      }
    };

    const token = jwt.sign(payload, JWT_SECRET);

    return res.status(200).send({
      success: true,
      message: "Student logged-in successfully",
      student,
      token
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error"
    });
  }
});

module.exports = routes;
