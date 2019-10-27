const jwt = require("jsonwebtoken");
const config = require("config");
const JWT_SECRET = process.env.JWT_SECRET || config.get("JWT_SECRET");
const Company = require("../models/companySignupSchema");
const Student = require('../models/studentSignupSchema');
const Admin = require('../models/adminLoginSchema');
// company authentication
const companyAuth = (req, res, next) => {
  const token = req.header("x-auth-header");
  if (!token) {
    return res.status(400).send({
      success: false,
      message: "No token authentication denied"
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const existingCompony = Company.findOne({ _id: decoded.company._id });

    if (!existingCompony) {
      return res.status(400).send({
        success: false,
        message: "Invalid token"
      });
    }

    req.company = decoded.company;
    next();
  } catch (error) {
    return res.status(500).send({
      success: false,
      error: "Token is not valid"
    });
  }
};


// admin authentication
const adminAuth = (req, res, next) => {
  const token = req.header("x-auth-header");
  if (!token) {
    return res.status(400).send({
      success: false,
      message: "No token authentication denied"
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = Admin.findOne({ _id: decoded.admin._id });

    if (!admin) {
      return res.status(400).send({
        success: false,
        message: "Invalid token"
      });
    }
    req.admin = decoded.admin;
    next();
  } catch (error) {
    return res.status(500).send({
      success: false,
      error: "Token is not valid"
    });
  }
};


// student authentication
const studentAuth = (req, res, next) => {
  const token = req.header("x-auth-header");
  if (!token) {
    return res.status(400).send({
      success: false,
      message: "No token authentication denied"
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const existingStudent = Student.findOne({ _id: decoded.student._id });

    if (!existingStudent) {
      return res.status(400).send({
        success: false,
        message: "Invalid token"
      });
    }

    req.student = decoded.student;
    next();
  } catch (error) {
    return res.status(500).send({
      success: false,
      error: "Token is not valid"
    });
  }
};


module.exports = {
    companyAuth,
    studentAuth,
    adminAuth
}