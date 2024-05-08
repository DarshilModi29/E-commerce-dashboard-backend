const mongoose = require("mongoose");
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const catSchema = new Schema({
    catName: ObjectId,
    name: String,
    description: String,
    status: Number
})

const subCatModel = mongoose.model("subCategory", catSchema);

module.exports = subCatModel;