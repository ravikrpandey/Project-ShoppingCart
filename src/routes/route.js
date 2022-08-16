const express = require("express");
const {
  registerUser,
  loginUser,
  getUserProfile,
  UpdateUser,
} = require("../controllers/userController");
const {
  createProduct,
  getProducts,
  getProducstById,
  deleteProductById,
  updateProductbyId,
} = require("../controllers/productController");
const { userAuthentication, authorization } = require("../middleware/auth");
const {
  createCart,
  getCart,
  deleteCart,
  updateCart,
} = require("../controllers/cartController");
const { createOrder, updateOrder } = require("../controllers/orderController");
const router = express.Router();

/*-------------------------------------User API --------------------------*/
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/user/:userId/profile", userAuthentication, getUserProfile);
router.put(
  "/user/:userId/profile",
  userAuthentication,
  authorization,
  UpdateUser
);

/*-------------------------------------Product API --------------------------*/

router.post("/products", createProduct);
router.get("/products", getProducts);
router.get("/products/:productId", getProducstById);
router.put("/products/:productId", updateProductbyId);
router.delete("/products/:productId", deleteProductById);

//-----------------------------------Cart API---------------------------------
router.post(
  "/users/:userId/cart",
  userAuthentication,
  authorization,
  createCart
);
router.put(
  "/users/:userId/cart",
  userAuthentication,
  authorization,
  updateCart
);
router.get("/users/:userId/cart", userAuthentication, authorization, getCart);
router.delete(
  "/users/:userId/cart",
  userAuthentication,
  authorization,
  deleteCart
);

//----------------------------------Order API------------------------------------
router.post(
  "/users/:userId/orders",
  userAuthentication,
  authorization,
  createOrder
);
router.put(
  "/users/:userId/orders",
  userAuthentication,
  authorization,
  updateOrder
);

//------------------------------- validating the route---------------------------
router.all("/*", function (req, res) {
  res.status(400).send({ status: false, message: "invalid http request" });
});

module.exports = router;
