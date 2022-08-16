const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const cartSchema = new mongoose.Schema(
  {
    userId: { type: ObjectId, ref: "Users", required: true, unique: true },
    items: [
      {
        productId: { type: ObjectId, ref: "Products", required: true },
        quantity: { type: Number, required: true, min: 1 },
        _id: 0,
      },
    ],
    totalPrice: { type: Number, required: true },
    totalItems: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
