const mongoose = require("mongoose");
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const brandSchema = new Schema({
    image: String,
    catName: ObjectId,
    subCatName: ObjectId,
    name: String,
    status: Number
})

const brandModel = mongoose.model("brand", brandSchema);

module.exports = brandModel;