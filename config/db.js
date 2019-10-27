const mongoose = require("mongoose");
const config = require("config");
const MONGO_URI =  process.env.MONGO_URI || config.get("MONGO_URI");

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    });
    console.log("mongodb connected successfully");
  } catch {
    console.log("mongodb is not connected");
  }
};

module.exports = connectDB;
