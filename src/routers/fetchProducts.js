const express = require("express");
const router = express.Router();
const mongoose = require("mongoose")
let productModel = require("../models/product");
let productdetailsModel = require("../models/productDetails");
let catModel = require("../models/category");
let varModel = require("../models/variationTypes");
let contactModel = require("../models/contact");

router.post("/contact", async (req, res) => {
    let data = new contactModel({
        name: req.body.name,
        email: req.body.email,
        subject: req.body.subject,
        message: req.body.message
    });
    await data.save();
    if (res.statusCode == 200) {
        res.json({ "message": "Your message has been sent ! we will reply to your message in 48 hours" });
    } else {
        res.statusCode(500).json({ "message": "Internal Server Error ! Please try later" });
    }
});

router.get("/getProduct", async (req, res) => {
    try {
        let limit = parseInt(req.query.limit);
        let offset = parseInt(req.query.offset);
        let minPrice = parseInt(req.query.minPrice);
        let maxPrice = parseInt(req.query.maxPrice);
        let variants = req.query.filter.split(",");
        let otherFilters = [];
        const totalDocs = await productModel.countDocuments({});
        let filter = [];

        for (let i = 0; i < variants.length; i++) {
            if (variants[i].endsWith("-all")) {
                let id = variants[i].replaceAll("-", " ").replaceAll("all", "").trim();
                id = mongoose.Types.ObjectId.createFromHexString(id);
                filter.push(id);
            } else {
                otherFilters.push(variants[i]);
            }
        }

        var pipeline = [
            {
                $lookup: {
                    from: "productdetails",
                    localField: "_id",
                    foreignField: "product_id",
                    as: "productData"
                }
            },
            {
                $sort: { "_id": -1 }
            },
        ];

        if (variants.length > 0 && !variants.includes('all-products') && (filter.length > 0 && otherFilters.length == 0)) {
            pipeline.push({
                $match: {
                    "productData.varType": { $in: filter }
                }
            });
        }

        if (variants.length > 0 && !variants.includes('all-products') && (otherFilters.length > 0 && filter.length == 0)) {
            pipeline.push({
                $match: {
                    "productData.varVal": { $in: otherFilters }
                }
            });
        }

        if (minPrice !== undefined && maxPrice !== undefined && minPrice !== "" && maxPrice !== 0) {
            pipeline.push({
                $match: {
                    "productData.price": {
                        $gte: minPrice,
                        $lte: maxPrice
                    }
                }
            });
        }
        if (minPrice === 0 && maxPrice === 0 && otherFilters.includes('all-products')) {
            pipeline.push(
                {
                    $skip: offset
                },
            );
            pipeline.push(
                {
                    $limit: limit
                },
            );
        }
        console.log(filter);
        console.log(otherFilters);
        const data = await productModel.aggregate(pipeline);
        if (data.length > 0) {
            res.json({ "data": data, "total": totalDocs });
        } else {
            res.json({ "message": "No brand available" });
        }
    } catch (e) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
        console.log(e);
    }
});

router.get("/getCategories", async (req, res) => {
    try {
        let data = await catModel.find({});
        res.json({ "data": data });
    } catch (error) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
        console.log(error);
    }
});

router.get("/getVariants", async (req, res) => {
    try {
        let data = await varModel.find({});
        res.json({ "data": data });
    } catch (error) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
        console.log(error);
    }
})

router.get("/getProductDetails", async (req, res) => {
    try {
        let _id = new mongoose.Types.ObjectId(req.query.id);
        let data = await productdetailsModel.aggregate([
            {
                $match: { "product_id": _id }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "productData"
                }
            },
            {
                $lookup: {
                    from: "variations",
                    localField: "varType",
                    foreignField: "_id",
                    as: "variantData"
                }
            },
            {
                $project: {
                    "productData.subCatName": 0,
                    "productData.catName": 0,
                    "productData.brandName": 0,
                    "productData.thumbnail": 0,
                    "productData.__v": 0,
                    "variantData.var_value": 0,
                    "variantData.__v": 0
                }
            }
        ]);
        res.json({ "data": data })
    } catch (err) {
        res.status(500).json({ "message": "Invalid Product" })
        console.log(err);
    }
})

router.get("/getCartDetails", async (req, res) => {
    try {
        let ids = [];
        let id = req.query.id ? req.query.id.split(",") : [];
        if (id.length > 0) {
            for (let i = 0; i < id.length; i++) {
                ids.push(mongoose.Types.ObjectId.createFromHexString(id[i]));
            }
        }
        let data = await productdetailsModel.aggregate([
            {
                $match: { "_id": { $in: ids } }
            }
        ]);
        res.json({ "data": data })
    } catch (err) {
        res.status(500).json({ "message": "Invalid Product" })
        console.log(err);
    }
})

module.exports = router;