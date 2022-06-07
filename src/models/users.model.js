const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
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
    required: false,
    trim: true,
    default: "undefined"
  },
  alerts: {
    type: [Object],
    required: false,
    default: []
  }
});

const Users = mongoose.model("Users", userSchema);
module.exports = Users;