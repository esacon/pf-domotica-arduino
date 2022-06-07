const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    trim: true,
  },
  alerts: {
    type: [Object],
    required: false,
    default: []
  }
});

const Users = mongoose.model("Users", userSchema);
module.exports = Users;