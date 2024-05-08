const mongoose = require("mongoose");
const { Schema } = mongoose;

const varSchema = new Schema({
    name: String,
    var_values: Array
})

const varModel = mongoose.model("variation", varSchema);

module.exports = varModel;