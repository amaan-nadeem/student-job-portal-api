const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const jobApplySchema = new Schema({
    totalExperience: {
        type: String,
        defualt: null
    },
    areaOfInterest: {
        type: [String],
        required: true
    },
    experienceInSpecifiedField: {
        type: String,
        defualt: null
    },
    freshie: {
        type: Boolean,
        default: true
    },
    certifications: {
        type: [String],
        default: []
    },
    jobId: {
        type: String,
        required: true,
        ref: 'jobs'
    },
    createdFor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'companiesData',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'studentsData',
        required: true
    }
},
{
  timestamps: true
});

const applyJob = mongoose.model('jobApplications', jobApplySchema);
module.exports = applyJob;
