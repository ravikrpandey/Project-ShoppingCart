const { isValidObjectId } = require("mongoose");
const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const { isValidRequest, isValidNumber } = require("../validator/validation");

// ----------------------------------------------Create cart------------------------------------------------
const createCart = async function (req, res) {
  try {
    let userIdFromPrams = req.user._id;

    if (!isValidRequest(req.body))
      return res.status(400).send({
        status: false,
        message: `Invalid Input. Body can't be empty!`,
      });

    const { productId, quantity, cartId } = req.body;

    let finalCart = { items: [], totalItems: 0, totalPrice: 0 };

    const product = {};
    // product ID validation
    if (!productId)
      return res
        .status(400)
        .send({ status: false, message: `Product ID is required!` });

    if (!isValidObjectId(productId))
      return res
        .status(400)
        .send({ status: false, message: `Invalid Product ID!` });

    const findProduct = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });
    if (!findProduct)
      return res.status(404).send({
        status: false,
        message: `Product- ${productId} is not found`,
      });
    product.productId = productId;

    // quantity validation
    if (quantity) {
      if (!isValidNumber(quantity) || quantity <= 0)
        return res
          .status(400)
          .send({ staus: false, message: `Minimum 1 quantity is required` });
      product.quantity = Math.floor(quantity);
    } else product.quantity = 1;

    let findCart = await cartModel.findOne({ userId: userIdFromPrams });

    let cart = {};
    // cart is not present
    if (!findCart) {
      finalCart.userId = userIdFromPrams;
      finalCart.items.push(product);
      finalCart.totalItems++;
      finalCart.totalPrice += product.quantity * findProduct.price;

      cart = await cartModel.create(finalCart);

      cart = await cartModel.findOne({ userId: userIdFromPrams }).populate({
        path: "items.productId",
        select: {
          _id: 1,
          title: 1,
          description: 1,
          price: 1,
          productImage: 1,
          style: 1,
        },
      });

      return res
        .status(201)
        .send({ status: true, message: "Success", data: cart });
    } else {
      let items = findCart.items;

      if (cartId) {
        if (!isValidObjectId(cartId))
          return res
            .status(400)
            .send({ status: false, message: "Invalid CartId" });
        else if (findCart._id != cartId)
          return res.status(400).send({
            status: false,
            message: "Cart is not belong to mentioned userID",
          });
      }

      let productPresent = false;
      for (let i = 0; i < items.length; i++) {
        if (items[i].productId == productId) {
          productPresent = true;
          items[i].quantity = items[i].quantity + product.quantity;
          findCart.totalPrice += product.quantity * findProduct.price;
        }
      }

      if (!productPresent) {
        findCart.totalPrice += product.quantity * findProduct.price;
        findCart.items.push(product);
      }

      findCart.totalItems = findCart.items.length;

      cart = await cartModel
        .findOneAndUpdate({ _id: findCart.id }, findCart, {
          new: true,
        })
        .populate({
          path: "items.productId",
          select: {
            _id: 1,
            title: 1,
            description: 1,
            price: 1,
            productImage: 1,
            style: 1,
          },
        });

      return res
        .status(200)
        .send({ status: true, message: "Success", data: cart });
    }
  } catch (error) {
    // console.log(error);
    res.status(500).send({ status: false, error: error.message });
  }
};

// ----------------------------------------------Update cart------------------------------------------------
const updateCart = async function (req, res) {
  try {
    const userId = req.user._id;
    let { cartId, productId, removeProduct } = req.body;

    let cart = await cartModel.findOne({ userId: userId });
    if (!cart)
      return res
        .status(400)
        .send({ status: false, message: "Cart is Not Available" });

    // cart ID validation
    if (cartId) {
      if (!isValidObjectId(cartId))
        return res
          .status(400)
          .send({ status: false, message: "Cart Id is invalid" });
      if (cart._id != cartId)
        return res.status(400).send({
          status: false,
          message: "Cart is not belong to mentioned userID",
        });
    } else cartId = cart._id;

    if (!productId)
      return res
        .status(400)
        .send({ status: false, message: "Product ID is required" });

    if (!isValidObjectId(productId))
      return res
        .status(400)
        .send({ status: false, message: "Product Id is invalid" });

    const product = await productModel.findById(productId);
    if (!product)
      return res
        .status(400)
        .send({ status: false, message: "Product Id is not found" });

    if (product.isDeleted == true)
      return res
        .status(400)
        .send({ status: false, message: "Product Id is deleted" });

    let productInCart = cart.items;
    let productToUpdate;
    let indexOfProduct = 0;
    for (let i = 0; i < productInCart.length; i++) {
      if (productInCart[i].productId == productId) {
        indexOfProduct = i;
        productToUpdate = productInCart[i];
      }
    }

    if (!productToUpdate)
      return res
        .status(404)
        .send({ status: false, message: "Product is not found in cart" });

    let updateProduct = {};

    if (![0, 1].includes(removeProduct))
      return res.status(400).send({
        status: false,
        message:
          "Please enter 0 to remove product or 1 to decrease quantity of product",
      });

    if (removeProduct == 1) {
      for (let i = 0; i < productInCart.length; i++) {
        if (productInCart[i].productId == productId) {
          productInCart[i].quantity = --productToUpdate.quantity;
          indexOfProduct = i;
          productToUpdate = productInCart[i];
        }
      }
      updateProduct.items = productInCart;
      updateProduct.totalPrice = cart.totalPrice - product.price;
    }
    if (removeProduct == 0 || productToUpdate.quantity <= 0) {
      updateProduct.items = [
        ...productInCart.slice(0, indexOfProduct),
        ...productInCart.slice(indexOfProduct + 1, productInCart.length),
      ];
      updateProduct.totalItems = --cart.totalItems;
      if (productToUpdate.quantity == 0)
        updateProduct.totalPrice = cart.totalPrice - product.price;
      else
        updateProduct.totalPrice =
          cart.totalPrice - product.price * productToUpdate.quantity;
    }

    const updatedCart = await cartModel
      .findOneAndUpdate({ _id: cartId, userId: userId }, updateProduct, {
        new: true,
      })
      .populate({
        path: "items.productId",
        select: {
          _id: 1,
          title: 1,
          description: 1,
          price: 1,
          productImage: 1,
          style: 1,
        },
      });

    return res
      .status(200)
      .send({ status: true, message: "Success", data: updatedCart });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, message: error.message });
  }
};

//------------------------------------Get cart-----------------------------------------
const getCart = async (req, res) => {
  try {
    let userId = req.user._id;

    const userCart = await cartModel.findOne({ userId: userId }).populate({
      path: "items.productId",
      select: {
        _id: 1,
        title: 1,
        description: 1,
        price: 1,
        productImage: 1,
        style: 1,
      },
    });
    if (!userCart) {
      return res.status(404).send({ status: false, message: "no cart Found" });
    }
    res.status(200).send({ status: true, message: "Success", data: userCart });
  } catch (error) {
    res.status(500).send({ status: false, error: error.message });
  }
};

//----------------------------------------------Delete cart------------------------------------------------
const deleteCart = async (req, res) => {
  try {
    let userId = req.user._id;

    let cart = {
      items: [],
      totalItems: 0,
      totalPrice: 0,
    };
    const updatedCart = await cartModel.findOneAndUpdate(
      { userId: userId },
      cart
    );
    if (!updatedCart) {
      return res.status(404).send({ status: false, message: "No cart Found" });
    }
    res.status(204).send({ status: true, message: "cart is deleted" });
    
  } catch (error) {
    res.status(500).send({ status: false, error: error.message });
  }
};

module.exports = { createCart, getCart, deleteCart, updateCart };
