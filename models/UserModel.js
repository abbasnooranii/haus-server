const { Schema, default: mongoose } = require("mongoose");

const UserSchema = new Schema({
  title: String,
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  current_setuation: String,
  alerts: String,
});

const User = new mongoose.model("users", UserSchema);

module.exports = User;
