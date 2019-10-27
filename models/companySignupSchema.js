const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const companySchema = new Schema({
    companyName: {
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
    buisnessPhoneNumber: {
        type: Number,
        required: true
    },
    buisnessDetails: {
        type: String,
        required: true
    },
    companyAddress: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    }
},
{
  timestamps: true
});


const companiesData = mongoose.model('companiesData', companySchema);
module.exports = companiesData;