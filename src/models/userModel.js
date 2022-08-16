const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    fname: { type: String, require: true, trim: true },
    lname: { type: String, require: true, trim: true },
    email: {
      type: String,
      require: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    profileImage: { type: String, require: true }, // s3 link
    phone: { type: String, require: true, unique: true },
    password: { type: String, require: true, max: 15, min: 8, trim: true }, // encrypted password
    address: {
      shipping: {
        street: { type: String, require: true },
        city: { type: String, require: true },
        pincode: { type: Number, require: true },
      },
      billing: {
        street: { type: String, require: true },
        city: { type: String, require: true },
        pincode: { type: Number, require: true },
      },
    },
  },
  { timestamps: true }
);

// checking if password is valid
userSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};
module.exports = mongoose.model("User", userSchema);
