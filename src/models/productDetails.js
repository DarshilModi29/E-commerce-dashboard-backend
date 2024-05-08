const mongoose = require("mongoose");
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const productDetailsSchema = new Schema({
    product_id: ObjectId,
    image: Array,
    price: Number,
    compare_price: Number,
    qty: Number,
    varType: ObjectId,
    varVal: Array,
    status: Number
})

const productDetailsModel = mongoose.model("productDetail", productDetailsSchema);

module.exports = productDetailsModel;