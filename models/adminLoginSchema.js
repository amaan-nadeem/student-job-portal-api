const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminSchema = new Schema({
        adminName: {
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
        }
},
{
  timestamps: true
});


const adminData = mongoose.model('adminData', adminSchema);
module.exports = adminData;