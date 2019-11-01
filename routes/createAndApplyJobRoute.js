const mongoose = require("mongoose");
const express = require("express");
const routes = express.Router();
const Joi = require("@hapi/joi");
const config = require("config");
const auth = require("../middleware/auth");
const Job = require("../models/createJobsSchema");
const JobApply = require("../models/jobApplyingSchema");

const JWT_SECRET = process.env.JWT_SECRET || config.get("JWT_SECRET");

// @route POST
// @desc creating jobs
// @access Private

const postApiParamsSchema = Joi.object({
  requiredPosition: Joi.string().required(),
  requiredExperience: Joi.string().required()
});
routes.post("/create-jobs", auth.companyAuth, async (req, res) => {
  let { requiredPosition, requiredExperience } = req.body;

  // checking error before creating any job
  if (!requiredExperience) {
    return res.status(400).send({
      success: false,
      message: '"requiredExperience" is not allowed to be empty'
    });
  } else if (!requiredPosition) {
    return res.status(400).send({
      success: false,
      message: '"requiredPosition" is not allowed to be empty'
    });
  }
  requiredExperience = requiredExperience.trim();
  requiredPosition = requiredPosition.trim();
  const { error } = postApiParamsSchema.validate({
    requiredPosition,
    requiredExperience
  });
  if (error) {
    return res.status(400).send({
      success: false,
      message: error.details[0].message
    });
  }

  try {
    let newJob = await new Job({
      requiredExperience,
      requiredPosition,
      createdBy: req.company._id
    });

    await newJob.save();

    newJob = await newJob.populate("createdBy", { password: 0 }).execPopulate();
    return res.status(200).send({
      success: true,
      message: "Job created Successfully",
      newJob
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error"
    });
  }
});

// @route POST
// @desc creating jobs
// @access Private

const jobPostApiParamsSchema = Joi.object({
  totalExperience: Joi.string().required(),
  experienceInSpecifiedField: Joi.string().required()
});

routes.post("/apply-for-job/:id", auth.studentAuth, async (req, res) => {
  let {
    totalExperience,
    areaOfInterest,
    experienceInSpecifiedField,
    certificatons,
    freshie
  } = req.body;
  const isValidId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!isValidId) {
    return res.status(400).json({
      success: false,
      message: "Invalid Job ID"
    });
  }

  try {

     // checking if the student already applied for job or not
     const studentJobs = await JobApply.find({createdBy: req.student._id});
     const jobIds = studentJobs.filter((_id) => {
       return req.params.id === _id.jobId 
        })

      if(jobIds.length !== 0){
        return res.status(400).send({
          success: false,
          message: 'You Already have applied to this Job'
        })
      }

    // API params error handling
    if (!totalExperience || !experienceInSpecifiedField) {
      return res.status(400).send({
        success: false,
        message: "Please fill the required fields"
      });
    }
    // checking whitespace

    totalExperience = totalExperience.trim();
    experienceInSpecifiedField = totalExperience.trim();
    const { error } = jobPostApiParamsSchema.validate({
      totalExperience,
      experienceInSpecifiedField
    });
    if (error) {
      return res.status(400).send({
        success: false,
        message: error.details[0].message
      });
    }
    // job id
    const _id = await Job.findOne({ _id: req.params.id });
 
    if (!_id) {
      return res.status(400).send({
        success: false,
        message: "No Job found against the specified Job id"
      });
    }

    const company = await _id
      .populate("createdBy", { password: 0 })
      .execPopulate();


    const jobApply = await new JobApply({
      totalExperience,
      areaOfInterest,
      experienceInSpecifiedField,
      certificatons,
      freshie,
      jobId: req.params.id,
      createdFor: company.createdBy._id,
      createdBy: req.student._id
    });
    
    jobApply.save();
    const jobDetail = await jobApply.populate("createdBy" , {password: 0}).execPopulate();
 
  return res.status(200).send({
      success: true,
      message: 'Job Application Successful',
      jobDetail
    })

  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error"
    })
  }
});

module.exports = routes;
