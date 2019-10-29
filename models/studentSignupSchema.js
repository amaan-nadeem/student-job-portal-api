const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentsSchema = new Schema({
    studentName: {
        type: String,
        required: true
    },
    fatherName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    collegeName: {
        type: String,
        required: true
    },
    majors: {
        type: [String],
        required: true
    },
    gender: {
        type: String,
        required: true
    }
},
{
  timestamps: true
});

const studentsData = mongoose.model('studentsData', studentsSchema);
module.exports = studentsData;