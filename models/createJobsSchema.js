const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const jobSchema = new Schema({
    requiredPosition: {
        type: String,
        required: true,
    },
    requiredExperience: {
        type: String,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'companiesData',
        required: true
    }
},
{
  timestamps: true
});



const jobs = mongoose.model('jobs', jobSchema);
module.exports = jobs;