const jwt = require("jsonwebtoken");
const { isValidObjectId } = require("mongoose");
const userModel = require("../models/userModel");

// ------------------------------------------------Authentication------------------------------------------------
const userAuthentication = async function (req, res, next) {
  try {
    let bearerHeader = req.headers["authorization"];
    // checking token
    if (!bearerHeader)
      return res
        .status(401)
        .send({ status: false, message: "token must be present" });

    const bearer = bearerHeader.split(" ");
    const token = bearer[1];

    // validating the token
    jwt.verify(token, "project5-group47", function (err, decoded) {
      if (err) {
        let msg =
          err.message === "jwt expired"
            ? "token is expired"
            : "token is invalid";
        return res.status(401).send({ status: false, message: msg });
      } else {
        // creating an attribute in "req" to access the token outside the middleware
        req.token = decoded;
        next();
      }
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

//------------------------------------------------Authorization------------------------------------------------
const authorization = async function (req, res, next) {
  try {
    let userId = req.params.userId;
    let userLoggedIn = req.token.userId;

    if (!isValidObjectId(userId))
      return res
        .status(400)
        .send({ status: false, message: "Please enter valid userId" });
    // User validation
    let user = await userModel.findOne({
      _id: userId,
    });
    if (!user) {
      return res
        .status(404)
        .send({ status: false, message: "No such user exists" });
    }
    // token validation
    if (userLoggedIn != user._id)
      return res.status(403).send({
        status: false,
        message: "You are not authorized to perform this task",
      });

    // creating an attribute in "req" to access the blog data outside the middleware
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).send({ status: false, message: "token is invalid" });
  }
};

module.exports = {
  userAuthentication,
  authorization,
};
