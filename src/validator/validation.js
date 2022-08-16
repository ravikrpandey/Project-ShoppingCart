const aws = require("aws-sdk");
const bcrypt = require("bcrypt");

// function for validating input request
const isValidRequest = function (data) {
  if (!data) return false;
  if (Object.keys(data).length == 0) return false;
  return true;
};

const isValidValues = function (data) {
  if (!data) return false;
  if (Object.values(data).length == 0) return false;
  if (Object.values(data).length > 0) {
    const checkData = Object.values(data).filter((value) => value);
    if (checkData.length == 0) return false;
  }
  return true;
};

// function for name verification
const isValidName = function (name) {
  return /^[a-zA-Z.-]{2,30}$/.test(name);
};

// function for mobile verification
const isValidMobile = function (num) {
  return /^[6789]\d{9}$/.test(num);
};

// function for pincode verification
const isValidPincode = function (num) {
  return /^[1-9][0-9]{5}$/.test(num);
};

// function for mail verification
const isValidMail = function (v) {
  v = v.toLowerCase();
  return /^([0-9a-zA-Z]([-_\\.]*[0-9a-zA-Z]+)*)@([a-z]([-_\\.]*[a-z]+)*)[\\.]([a-z]{2,9})+$/.test(
    v
  );
};

// function for password verification
const isValidPassword = function (pass) {
  return /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])([a-zA-Z0-9!@#$%^&*]{8,15})$/.test(
    pass
  );
};

// function for string verification
const isValid = function (value) {
  if (!value) return false;
  if (typeof value === "undefined" || value === null) return false;
  if (value.length === 0) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  else if (typeof value === "string") return true;
};

let uploadFile = async (file) => {
  return new Promise(function (resolve, reject) {
    // this function will upload file to aws and return the link
    let s3 = new aws.S3({ apiVersion: "2006-03-01" }); // we will be using the s3 service of aws

    var uploadParams = {
      ACL: "public-read",
      Bucket: "classroom-training-bucket", //HERE
      Key: "ProductManagementGroup47/" + file.originalname, //HERE
      Body: file.buffer,
    };

    s3.upload(uploadParams, function (err, data) {
      if (err) {
        return reject({ error: err });
      }
      return resolve(data.Location);
    });
  });
};

const generateHash = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
const isValidNumber = function (value) {
  if (isNaN(value)) return false;
  return true;
};

function isJsonString(jsonData) {
  if (typeof jsonData == "string") {
    if (!/^[\[|\{](\s|.*|\w)*[\]|\}]$/.test(jsonData)) {
      return jsonData;
    }
  }
}

module.exports = {
  isValidRequest,
  isValidName,
  isValidMobile,
  isValidMail,
  isValidPassword,
  isValidPincode,
  isValid,
  uploadFile,
  generateHash,
  isValidNumber,
  isJsonString,
  isValidValues,
};
