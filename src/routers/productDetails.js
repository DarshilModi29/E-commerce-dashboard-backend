const express = require("express");
const router = express.Router();
const productDetail = require("../models/productDetails")
const multer = require("multer");
const mongoose = require("mongoose");
const fs = require('fs');
const Auth = require("../middleware/Auth");
var oldFiles;
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/products/product/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + file.originalname
        cb(null, uniqueSuffix)
    }
})
const upload = multer({ storage: storage, dest: "images/products/product/" })


router.post("/createProductDetails", Auth, upload.array('pro_image'),
    async (req, res) => {
        try {
            let fullPath = [];
            for (let i = 0; i < req.files.length; i++) {
                fullPath.push(`${req.files[i].destination}${req.files[i].filename}`);
            }
            let productData = new productDetail({
                product_id: req.body.product_id,
                image: fullPath,
                price: req.body.price,
                compare_price: req.body.compare_price ? req.body.compare_price : 0,
                qty: req.body.qty,
                varType: req.body.variationType ? req.body.variationType : null,
                varVal: req.body.variationValue ? req.body.variationValue : null,
                status: req.body.pro_status
            });
            await productData.save();
            if (res.statusCode == 200) {
                res.json({ "message": "Product Details Created" });
            } else {
                res.status(500).json({ "message": "Unexpected error occurred" });
            }
        } catch (e) {
            console.log(e);
            res.status(500).json({ "message": e.toString() });
        }
    });

router.get("/getProductDetails", Auth, async (req, res) => {
    try {
        let _id = new mongoose.Types.ObjectId(req.query.id);
        let data = await productDetail.aggregate([
            {
                $match: { product_id: _id }
            },
            {
                $lookup: {
                    from: "variations",
                    localField: "varType",
                    foreignField: "_id",
                    as: "VarByProducts"
                }
            },
            {
                $project: {
                    "VarByProduts.var_values": 0,
                    "VarByProduts.__v": 0
                }
            }
        ]);
        if (data.length > 0) {
            res.json({ "data": data });
        } else {
            res.json({ "message": "No Dataavailable" });
        }
    } catch (e) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
        console.log(e);
    }
});

router.get("/productDetails", Auth, async (req, res) => {
    try {
        const _id = req.query.id;
        const data = await productDetail.findOne({ _id });
        oldFiles = data.image;
        if (data) {
            res.json({ "data": data });
        } else {
            res.status(404).json({ "message": "No data found" });
        }
    } catch (e) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
        console.log(e.toString());
    }
});

router.patch("/updateProductDetails", Auth, upload.array('pro_image'),
    async (req, res) => {
        console.log(req.body);
        try {
            let _id = req.query.id;
            let fullPath = [];

            if (req.files.length > 0) {
                for (let i = 0; i < req.files.length; i++) {
                    fullPath.push(`${req.files[i].destination}${req.files[i].filename}`);
                }
            }
            else {
                fullPath = oldFiles;
            }
            await productDetail.findByIdAndUpdate(_id, {
                image: fullPath,
                price: req.body.price,
                compare_price: req.body.compare_price,
                qty: req.body.qty,
                varType: req.body.variationType,
                varVal: req.body.variationValue,
                status: req.body.pro_status
            });
            if (res.statusCode == 200) {
                if (req.files.length > 0) {
                    oldFiles.forEach(async (image) => {
                        if (fs.existsSync(image)) {
                            await fs.promises.unlink(image);
                        }
                    })
                }
                res.json({ "message": "Product Details Updated" });
            } else {
                res.status(500).json({ "message": "Unexpected error occurred" });
            }
        } catch (e) {
            console.log(e);
            res.status(500).json({ "message": e.toString() });
        }
    });


router.delete("/productDetails/:id", Auth, async (req, res) => {
    try {
        const _id = new mongoose.Types.ObjectId(req.params.id);
        const singleData = await productDetail.findOne(_id);
        let images = singleData.image;
        await productDetail.findByIdAndDelete(_id);
        if (res.statusCode == 200) {
            images.forEach(async (image) => {
                if (fs.existsSync(image)) {
                    await fs.promises.unlink(image);
                }
            })
            res.json({ "message": "Product Deleted Successfully!" });
        } else {
            res.status(404).json({ "message": "Error in Deletion" });
        }
    } catch (error) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
        console.log(error);
    }
});

router.patch("/product/qty", Auth, async (req, res) => {
    try {
        const _id = new mongoose.Types.ObjectId(req.query.id);
        const singleData = await productDetail.findOne(_id);
        const operation = req.query.operation;
        if (operation == "changeStatus") {
            var status = singleData.status;
            status = status == 0 ? 1 : 0;
            await productDetail.findByIdAndUpdate(_id, { status: status });
        } else {
            var qty = singleData.qty;
            switch (operation) {
                case "add":
                    qty += 1;
                    break;
                case "sub":
                    if (qty > 0) {
                        qty -= 1;
                    }
                    break;
            }
            await productDetail.findByIdAndUpdate(_id, { qty: qty });
        }
        if (res.statusCode !== 200) {
            res.status(400).json({ "message": "Error in Updating Quantity" });
        } else {
            res.json({ "status": 1 });
        }
    } catch (e) {
        console.log(e);
    }
});

module.exports = router;