const mongoose = require("mongoose");
const { Schema } = mongoose;

const catSchema = new Schema({
    name: String,
    status: Number
})

const catModel = mongoose.model("category", catSchema);

module.exports = catModel;