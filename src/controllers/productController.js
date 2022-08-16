const productModel = require("../models/productModel");
const { isValidObjectId } = require("mongoose");
const {
  uploadFile,
  isValid,
  isValidNumber,
  isValidRequest,
  isValidValues,
} = require("../validator/validation");

//-----------------------------------------------Create Product-----------------------------------------------
const createProduct = async function (req, res) {
  try {
    if (!isValidRequest(req.body) || req.files.length == 0)
      return res
        .status(400)
        .send({ status: false, message: "Please enter valid input" });

    let productImage = req.files;
    let {
      title,
      description,
      price,
      availableSizes,
      isFreeShipping,
      style,
      installments,
      currencyId,
      currencyFormat,
    } = req.body;

    let product = {};

    // title validation
    if (!title) {
      return res
        .status(400)
        .send({ status: false, message: `Title is mandatory!` });
    }
    if (!isValid(title)) {
      return res
        .status(400)
        .send({ status: false, message: `Please input valid Title!` });
    }
    const isTitleAlreadyUsed = await productModel.findOne({ title: title });
    if (isTitleAlreadyUsed) {
      return res
        .status(409)
        .send({ status: false, message: `${title} is already exists!` });
    }
    product.title = title
      .split(" ")
      .filter((word) => word)
      .join(" ");

    // description validation
    if (!description) {
      return res
        .status(400)
        .send({ status: false, message: `Description is mandatory!` });
    }
    if (!isValid(description)) {
      return res
        .status(400)
        .send({ status: false, message: `Please input valid Description!` });
    }
    product.description = description
      .split(" ")
      .filter((word) => word)
      .join(" ");

    // price validation
    if (!price) {
      return res
        .status(400)
        .send({ status: false, message: `Price is mandatory!` });
    }
    if (!isValidNumber(price)) {
      return res.status(400).send({
        status: false,
        message: `Please input valid Price(Numeric Values Only)!`,
      });
    }
    product.price = (Math.round(price * 100) / 100).toFixed(2);

    // validation for isFreeShipping
    if (isFreeShipping)
      if (["true", "false"].includes(isFreeShipping))
        product.isFreeShipping = isFreeShipping;
      else
        return res.status(400).send({
          status: false,
          message: "Value of isFreeShipping should be Boolean",
        });

    // product image validation
    if (productImage && productImage.length == 0)
      return res
        .status(400)
        .send({ status: false, message: "Profile Image is required" });
    else if (
      !/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i.test(productImage[0].originalname)
    )
      return res.status(400).send({
        status: false,
        message: "Profile Image is required as an Image format",
      });
    else product.productImage = await uploadFile(productImage[0]);

    // validation for style
    if (style) {
      if (!isValid(style))
        return res
          .status(400)
          .send({ status: false, message: "Please enter valid style" });
      product.style = style;
    }

    //installments validation
    if (installments) {
      if (!isValidNumber(installments))
        return res
          .status(400)
          .send({ status: false, message: "Please enter valid Installments" });
      product.installments = parseInt(installments);
    }

    // validation of availableSizes
    if (!availableSizes)
      return res
        .status(400)
        .send({ status: false, message: "At least one size is required" });

    availableSizes = availableSizes.split(",").filter((size) => {
      const trimSize = size.trim();
      return (
        isValid(trimSize) &&
        ["S", "XS", "M", "X", "L", "XXL", "XL"].includes(trimSize)
      );
    });
    if (availableSizes.length == 0)
      return res.status(400).send({
        status: false,
        message: `available sizes should be in valid format and should be from:  S, XS, M, X, L, XXL, XL`,
      });
    else product.availableSizes = availableSizes;

    if (currencyId) {
      if (!["INR", "USD"].includes(currencyId))
        return res
          .status(400)
          .send({ status: false, message: "Only INR/USD currency is allowed" });
      product.currencyId = currencyId;
    } else product.currencyId = "INR";

    if (currencyId == "INR") product.currencyFormat = "₹";
    else if (currencyId == "USD") product.currencyFormat = "$";

    const userData = await productModel.create(product);
    res.status(201).send({ status: true, message: "Success", data: userData });

  } catch (error) {
    return res.status(500).send({ status: false, error: error.message });
  }
};

//-----------------------------------------------Get product-----------------------------------------------
const getProducts = async (req, res) => {
  try {
    let data = req.query;
    let filters = {};

    let checkQueryParams = Object.keys(data);
    let arr = [
      "priceLessThan",
      "priceGreaterThan",
      "name",
      "size",
      "priceSort",
    ];
    for (let i = 0; i < checkQueryParams.length; i++) {
      let update = arr.includes(checkQueryParams[i]);
      if (!update)
        return res.status(400).send({
          status: false,
          message:
            "you can only provide values for priceLessThan, priceGreaterThan, name and size fields.",
        });
    }

    // size validation
    if (data.size != undefined) {
      let size = data.size.split(",");

      if (size.length == 0)
        return res
          .status(400)
          .send({ status: false, message: "Please enter valid size" });

      const validSize = size.forEach((x) => {
        const ele = x.trim();
        if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(ele))
          return false;
      });

      if (validSize == false)
        return res
          .status(400)
          .send({ status: false, msg: "Please enter valid size" });
      else filters.availableSizes = { $in: size };
    }

    // name validation
    if (data.name != undefined) {
      let name = data.name.trim();
      if (!isValid(name))
        return res
          .status(400)
          .send({ status: false, message: "Please enter valid title" });
      filters.title = new RegExp(name, "i");
    }

    // price validations
    if (data.priceGreaterThan != undefined && data.priceLessThan != undefined) {
      let priceGreaterThan = data.priceGreaterThan.trim();
      let priceLessThan = data.priceLessThan.trim();
      if (!isValidNumber(priceLessThan) || !isValidNumber(priceGreaterThan))
        return res.status(400).send({
          status: false,
          message: "Please enter valid Price range",
        });
      if (priceGreaterThan == priceLessThan)
        return res.status(400).send({
          status: false,
          message: "PriceGreaterThan and priceLessThan can't be same",
        });
      if (Number(priceGreaterThan) > Number(priceLessThan))
        return res.status(400).send({
          status: false,
          message: "PriceGreaterThan can't be greater than priceLessThan",
        });
      filters.price = { $gt: priceGreaterThan, $lt: priceLessThan };
    } else {
      if (data.priceGreaterThan != undefined) {
        let priceGreaterThan = data.priceGreaterThan.trim();

        if (!isValidNumber(priceGreaterThan))
          return res.status(400).send({
            status: false,
            message: "Please enter valid Greater than Price",
          });
        filters.price = { $gt: data.priceGreaterThan };
      }

      if (data.priceLessThan != undefined) {
        let priceLessThan = data.priceLessThan.trim();

        if (!isValidNumber(priceLessThan))
          return res.status(400).send({
            status: false,
            message: "Please enter valid Less than Price",
          });
        filters.price = { $lt: data.priceLessThan };
      }
    }

    let sortPrice = {};
    if (data.priceSort != undefined) {
      if (data.priceSort != 1 && data.priceSort != -1)
        return res.status(400).send({
          status: false,
          message:
            "Please enter priceSort = 1 for ascending and priceSort = -1 for descending",
        });
      else if (data.priceSort == -1) sortPrice = { price: -1 };
      else sortPrice = { price: 1 };
    } else sortPrice = { price: 1 };

    filters.isDeleted = false;

    const productData = await productModel
      .find(filters)
      .sort(sortPrice)
      .select({ deletedAt: 0 });

    if (productData.length === 0) {
      return res
        .status(404)
        .send({ status: false, message: "Product not found" });
    }

    return res
      .status(200)
      .send({ status: true, message: "Success", data: productData });

  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, error: error.message });
  }
};

//-----------------------------------------------Get product by ID-----------------------------------------------

const getProducstById = async function (req, res) {
  try {
    let productId = req.params.productId;

    if (!isValidObjectId(productId))
      return res
        .status(400)
        .send({ status: false, message: "Invalid Product ID" });

    let getProduct = await productModel.findById(productId);

    if (!getProduct)
      return res.status(404).send({
        status: false,
        message: "Product for the mentioned ProductID is not found ",
      });

    if (getProduct.isDeleted == true)
      return res
        .status(400)
        .send({ status: false, message: "Product is deleted" });

    return res
      .status(200)
      .send({ status: true, message: "Success", data: getProduct });
      
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

//------------------------------------------------Update Product------------------------------------------------
const updateProductbyId = async function (req, res) {
  try {
    const productId = req.params.productId;

    if (!isValidObjectId(productId))
      return res
        .status(400)
        .send({ status: false, message: "Invalid Product ID" });

    const requestBody = JSON.parse(JSON.stringify(req.body));
    let productImage = req.files;
    let {
      title,
      description,
      price,
      availableSizes,
      isFreeShipping,
      style,
      installments,
    } = requestBody;

    let product = {};

    if (
      !isValidValues(requestBody) &&
      (productImage === undefined || productImage?.length === 0)
    ) {
      return res.status(400).send({
        status: false,
        message: "Please enter valid Input in request",
      });
    }

    // title validation
    if (requestBody.hasOwnProperty("title")) {
      if (!isValid(title))
        return res
          .status(400)
          .send({ status: false, message: "Invalid Title" });

      const checkTitle = await productModel.findOne({ title: title });
      if (checkTitle)
        return res.status(400).send({
          status: false,
          message: `"${title}"-Title is already in use`,
        });
      product.title = title
        .split(" ")
        .filter((word) => word)
        .join();
    }

    // description validation
    if (requestBody.hasOwnProperty("description")) {
      if (!isValid(description))
        return res
          .status(400)
          .send({ status: false, message: "Invalid Description" });
      product.description = description
        .split(" ")
        .filter((word) => word)
        .join(" ");
    }

    // price validation
    if (requestBody.hasOwnProperty("price")) {
      if (!isValidNumber(price)) {
        return res.status(400).send({
          status: false,
          message: `Please input valid Price(Numeric Values Only)!`,
        });
      }
      product.price = (Math.round(price * 100) / 100).toFixed(2);
    }

    // validation for isFreeShipping
    if (requestBody.hasOwnProperty("isFreeShipping"))
      product.isFreeShipping = isFreeShipping;

    // product image validation
    if (productImage && productImage.length !== 0) {
      if (
        !/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i.test(productImage[0].originalname)
      )
        return res.status(400).send({
          status: false,
          message: "Profile Image is required as an Image format",
        });
      product.productImage = await uploadFile(productImage[0]);
    }

    // validation for style
    if (requestBody.hasOwnProperty("style")) {
      if (!isValid(style))
        return res
          .status(400)
          .send({ status: false, message: "Please enter valid style" });
      product.style = style;
    }

    // installments validation
    if (requestBody.hasOwnProperty("installments")) {
      if (!isValidNumber(installments))
        return res
          .status(400)
          .send({ status: false, message: "Please enter valid Installments" });
      product.installments = parseInt(installments);
    }

    let size = {};
    // available size validation
    if (requestBody.hasOwnProperty("availableSizes")) {
      availableSizes = availableSizes.split(",").filter((size) => {
        const trimSize = size.trim();
        return (
          isValid(trimSize) &&
          ["S", "XS", "M", "X", "L", "XXL", "XL"].includes(trimSize)
        );
      });
      if (availableSizes.length == 0)
        return res.status(400).send({
          status: false,
          message: `available sizes should be in valid format and should be from:  S, XS, M, X, L, XXL, XL`,
        });
      else size.availableSizes = { $each: availableSizes };
    }

    const updatedProduct = await productModel.findOneAndUpdate(
      { _id: productId, isDeleted: false },
      {
        $set: {
          title: product.title,
          description: product.description,
          price: product.price,
          isFreeShipping: product.isFreeShipping,
          productImage: product.productImage,
          style: product.style,
          installments: product.installments,
        },
        $addToSet: size,
      },
      { new: true }
    );

    if (!updatedProduct)
      return res
        .status(400)
        .send({ status: false, message: "Product is not found" });

    return res.status(200).send({
      status: true,
      message: "Update product details is successful",
      data: updatedProduct,
    });
  } catch (error) {
    return res.status(500).send({ status: false, error: error.message });
  }
};

//-----------------------------------------------Delete product by productID-----------------------------------------------
const deleteProductById = async (req, res) => {
  try {
    let productId = req.params.productId;

    if (!isValidObjectId(productId))
      return res
        .status(400)
        .send({ status: false, message: "Invalid product ID" });

    const checkID = await productModel.findOneAndUpdate(
      { _id: productId, isDeleted: false },
      { isDeleted: true, deletedAt: Date.now() }
    );
    if (!checkID) {
      return res
        .status(404)
        .send({ status: false, msg: `${productId} is not found in DB!` });
    }

    res.status(200).send({
      status: true,
      message: "Request product is deleted sucessfully",
    });
  } catch (error) {
    return res.status(500).send({ status: false, error: error.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProducstById,
  updateProductbyId,
  deleteProductById,
};
