const mongoose = require("mongoose");
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const productSchema = new Schema({
    thumbnail: String,
    catName: ObjectId,
    subCatName: ObjectId,
    brandName: ObjectId,
    name: String,
    desc: String,
    smallDesc: String,
})

const productModel = mongoose.model("product", productSchema);

module.exports = productModel;