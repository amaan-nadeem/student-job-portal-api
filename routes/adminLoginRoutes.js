const mongoose = require("mongoose");
const express = require("express");
const routes = express.Router();
const Joi = require("@hapi/joi");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const Admin = require("../models/adminLoginSchema");
const Company = require("../models/companySignupSchema");
const Student = require("../models/studentSignupSchema");
const auth = require("../middleware/auth");
const Jobs = require("../models/createJobsSchema");
const ApplyJobs = require('../models/jobApplyingSchema');

const JWT_SECRET = process.env.JWT_SECRET || config.get("JWT_SECRET");
// @route GET
// @desc total jobs
// @access private

const postApiParamsSchema = Joi.object({
  adminName: Joi.string().required(),
  password: Joi.string()
    .min(8)
    .required(),
  email: Joi.string().required()
});

// @route GET
// @desc fetching jobs
// @access private
routes.get("/jobs", auth.adminAuth, async (req, res) => {
  const companies = await Company.find({});

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
      let keys = Object.keys(eachCompanyJobs);
      if (keys.length !== 0) {
        console.log(eachCompanyJobs[count].createdBy.companyName);
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
      totalJobs
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error"
    });
  }
});

// @route GET
// @desc  fetching students
// @access private
routes.get("/students", auth.adminAuth, async (req, res) => {
  try {
    const students = await Student.find({});
    if (!students) {
      res.status(400).send({
        success: false,
        message: "No student found"
      });
    }
    const studentsJobApplications = await ApplyJobs.find({}).populate(["createdBy", "createdFor"]);

    return res.status(200).send({
      success: true,  
      students,
      studentsJobApplications
    });
    
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error"
    })
  }
});


// @route POST
// @desc admin login
// @access public
routes.post("/login", async (req, res) => {
  let { adminName, email, password } = req.body;
  if(!email){
    res.status(400).send({
      success: false,
      message: "email is not allowed to be empty"
    })
  }
  if(!adminName){
    res.status(400).send({
      success: false,
      message: "email is not allowed to be empty"
    })
  }

  email = email.toLowerCase();
  adminName = adminName.toLowerCase();
  email = email.trim();
  adminName = adminName.trim();

  // validating api params
  const { error } = postApiParamsSchema.validate({
    adminName,
    password,
    email
  });
  if (error) {
    return res.status({
      success: false,
      message: error.details[0].message
    });
  }

  try {
    const adminData = await Admin.findOne({ email, adminName });

    if (!adminData) {
      return res.status(400).send({
        success: false,
        message: "login failed check your email or username"
      });
    }

    const isMatch = await bcrypt.compare(password, adminData.password);
    if (!isMatch) {
      return res.status(400).send({
        success: false,
        message: "Invalid Password"
      });
    }

    // creating jsonwebtoken
    const payload = {
      admin: {
        adminName: adminData.adminName,
        email: adminData.email,
        _id: adminData._id
      }
    };

    const token = jwt.sign(payload, JWT_SECRET);

    return res.status(200).send({
      success: true,
      message: "Admin logged-in successfully",
      adminData,
      token
    });
  } catch (error) {
    return res.send(500).send({
      success: false,
      message: "Internal server error"
    });
  }
});

// @route delete
// @desc delete job
// @access private
routes.delete("/delete-job/:id", auth.adminAuth, async (req, res) => {
  const isValidId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!isValidId) {
    return res.status(400).json({
      success: false,
      message: "Invalid Job ID"
    });
  }

  // task id
  const _id = req.params.id;
  try {
    // finding task and delete
    const jobToDelete = await Jobs.findByIdAndDelete({ _id });

    if (!jobToDelete) {
      return res.status(400).json({
        success: false,
        message: "No Job find against the given Job ID"
      });
    }

    // sending the response
    return res.json({
      success: true,
      message: "Job has been Deleted",
      jobToDelete
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// @route delete
// @desc delete company
// @access private
routes.delete("/delete-company/:id", auth.adminAuth, async (req, res) => {
  const isValidId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!isValidId) {
    return res.status(400).json({
      success: false,
      message: "Invalid Company ID"
    });
  }

  // task id
  try {
    const _id = req.params.id;

    // finding company created jobs
    let companyJobs = await Jobs.find({ createdBy: req.params.id }).populate(
      "createdBy",
      { password: 0 }
    );

    if (companyJobs.length > 0) {
      // deleting all the jobs company had created before
      for (let i = 0; i < companyJobs.length; i++) {
        const companyCreatedJobsId = companyJobs[i]._id;
        const eachJob = await Jobs.findByIdAndDelete({
          _id: companyCreatedJobsId
        });
      }
    }
    // finding task and delete
    const companyToDelete = await Company.findByIdAndDelete({ _id });

    if (!companyToDelete) {
      return res.status(400).json({
        success: false,
        message: "No Company find against the given Job ID"
      });
    }

    // sending the response
    return res.status(200).json({
      success: true,
      message: "Job has been Deleted",
      companyToDelete
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// @route delete
// @desc delete student
// @access private
routes.delete("/delete-student/:id", auth.adminAuth, async (req, res) => {
  const isValidId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!isValidId) {
    return res.status(400).json({
      success: false,
      message: "Invalid Student ID"
    });
  }

  // task id
  try {
    const appliedJobs = ApplyJobs.find({createdBy: req.params.id});
    
    const _id = req.params.id;
    // finding task and delete
    const studentToDelete = await Student.findByIdAndDelete({ _id });

    if (!studentToDelete) {
      return res.status(400).json({
        success: false,
        message: "No Student find against the given Job ID"
      });
    }

    // sending the response
    return res.status(200).json({
      success: true,
      message: "Student has been Deleted",
      studentToDelete
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// routes.post('/sign-up', async(req, res) => {
//     let {adminName, password, email} = req.body;
//     adminName = adminName.toLowerCase();
//     email = email.toLowerCase();

//     if (!email) {
//         return res.status(400).send({
//           success: false,
//           message: "PLease fill the email"
//         });
//       }

//       // email typo error checking
//       const emailSplit = email.split("@");
//       if (emailSplit.length < 2 || emailSplit.length > 2) {
//         return res.status(400).send({
//           success: false,
//           message: "Incorrect format of Email"
//         });
//       }

//     try {
//         const {error} = postApiParamsSchema.validate({adminName, password, email});

//         if (error) {
//             return res.status(400).send({
//               success: false,
//               message: error.details[0].message
//             });
//           }

//           const admin  = await new Admin({
//               adminName,
//               password,
//               email
//           })

//           // hashing the password
//     const salt = await bcrypt.genSalt(10);
//     const hash = await bcrypt.hash(password, salt);
//         admin.password = hash;

//         await admin.save();

//         return res.status(200).send({
//             success: true,
//             message: "Admin account created",
//             admin
//         })

//     } catch (error) {

//     }

// })

module.exports = routes;