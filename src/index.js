const express = require("express");
const app = express();
require("dotenv").config();
const bodyParser = require('body-parser');
const cors = require("cors");
const mongoose = require("mongoose");
const catRouter = require("./routers/category");
const subCatRouter = require("./routers/subCategory");
const brandRouter = require("./routers/brand");
const productRouter = require("./routers/product");
const productDetailsRouter = require("./routers/productDetails");
const varRouter = require("./routers/variationTypes");
const userRouter = require("./routers/user");
const port = process.env.PORT
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
app.use(catRouter);
app.use(subCatRouter);
app.use(brandRouter);
app.use(productRouter);
app.use(productDetailsRouter);
app.use(varRouter);
app.use(userRouter);

app.use("/images", express.static('images'))

mongoose.connect(process.env.HOST)
    .then(() => {
        console.log("Connection Successful");
    })
    .catch((err) => {
        console.log(err);
    })

app.listen(port, () => {
    console.log(`Server is running on ${port}`);
});