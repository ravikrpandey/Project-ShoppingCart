const cartModel = require("../models/cartModel");
const orderModel = require("../models/orderModel");
const { isValidRequest } = require("../validator/validation");
const { isValidObjectId } = require("mongoose");

//----------------------------------------Create Order API----------------------------------------//
const createOrder = async function (req, res) {
  try {
    const userId = req.user._id;

    if (!isValidRequest(req.body))
      return res
        .status(400)
        .send({ status: false, message: "Invalid Request" });

    let { cartId, cancellable } = req.body;

    if (!cartId)
      return res
        .status(400)
        .send({ status: false, message: "CartId is required" });

    if (!isValidObjectId(cartId))
      return res.status(400).send({ status: false, message: "Invalid CartId" });

    let cart = await cartModel
      .findOne({ _id: cartId, userId: userId })
      .select({ _id: 0 });

    if (!cart)
      return res
        .status(404)
        .send({ status: false, message: "Cart is not found" });

    if (cart.items.length == 0 || cart.totalPrice == 0 || cart.totalItems == 0)
      return res
        .status(400)
        .send({
          status: false,
          message: "Cart is empty, order can't be placed",
        });

    let totalQuantity = cart.items.reduce((acc, curr) => {
      acc += curr.quantity;
      return acc;
    }, 0);

    if (cancellable) {
      if (typeof cancellable !== Boolean)
        return res.status(400).send({
          status: false,
          message: "Please enter Booleane value for cancellable",
        });
      else cancellable = req.body.cancellable;
    } else cancellable = true;

    let order = {
      userId: userId,
      items: cart.items,
      totalPrice: cart.totalPrice,
      totalItems: cart.totalItems,
      totalQuantity: totalQuantity,
      cancellable: req.body.cancellable,
    };

    const placedOrder = await orderModel.create(order);

    const updateCart = {
      items: [],
      totalPrice: 0,
      totalItems: 0,
    };

    await cartModel.findOneAndUpdate(
      { _id: cartId, userId: userId },
      updateCart
    );

    return res
      .status(200)
      .send({ status: true, message: "Success", data: placedOrder });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, message: error.message });
  }
};

//----------------------------------------Update Order API----------------------------------------//
const updateOrder = async function (req, res) {
  try {
    userId = req.user._id;

    if (!isValidRequest(req.body))
      return res
        .status(400)
        .send({ status: false, message: "Invalid request" });

    let { orderId, status } = req.body;

    if (!orderId)
      return res
        .status(400)
        .send({ status: false, message: "OrderId is required" });

    if (!isValidObjectId(orderId))
      return res
        .status(400)
        .send({ status: false, message: "OrderId is invalid" });

    let order = await orderModel.findOne({ userId: userId, _id: orderId });

    if (!order)
      return res
        .status(404)
        .send({ status: false, message: "Order is not found" });

    if (!status)
      return res
        .status(400)
        .send({ status: false, message: "Status is required" });

    if (!["completed", "cancled"].includes(status))
      return res.status(400).send({
        status: false,
        message: `Status should be from completed/cancled`,
      });

    if (status == "cancled" && order.cancellable == false)
      return res.status(400).send({
        status: false,
        message: "Order is not cancellable",
      });

    const savedData = await orderModel.findOneAndUpdate(
      { _id: orderId, userId: userId },
      { status: status },
      { new: true }
    );

    return res
      .status(200)
      .send({ status: true, message: "Success", data: savedData });
      
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = { createOrder, updateOrder };
