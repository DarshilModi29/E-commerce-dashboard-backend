const mongoose = require("mongoose");
const { Schema } = mongoose;

const contactSchema = new Schema({
    name: String,
    email: String,
    subject: String,
    message: String,
})

const contactModel = mongoose.model("contact", contactSchema);

module.exports = contactModel;