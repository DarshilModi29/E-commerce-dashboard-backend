const express = require("express");
const router = express.Router();
const brandModel = require("../models/brand");
const productModel = require("../models/product");
const multer = require("multer");
const mongoose = require("mongoose");
const fs = require('fs');
const Auth = require("../middleware/Auth");
var oldThumbnail;
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/products/thumbnail/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + file.originalname
        cb(null, uniqueSuffix)
    }
})
const upload = multer({ storage: storage, dest: "images/products/thumbnail/" })


router.post("/createProduct", Auth, upload.single('pro_thumbnail'),
    async (req, res) => {
        try {
            let thumbnailPath = `${req.file.destination}${req.file.filename}`;
            let productData = new productModel({
                thumbnail: thumbnailPath,
                catName: req.body.catName,
                subCatName: req.body.subCatName,
                brandName: req.body.brandName,
                name: req.body.pro_name,
                desc: req.body.pro_desc,
                smallDesc: req.body.pro_small_desc
            });
            // await productData.save();
            if (res.statusCode == 200) {
                res.json({ "message": "Product Created" });
            } else {
                res.status(500).json({ "message": "Unexpected error occurred" });
            }

        } catch (e) {
            console.log(e);
            res.status(500).json({ "message": e.toString() });
        }
    });

router.get("/brand/product", Auth, async (req, res) => {
    try {
        const data = await brandModel.find({
            "subCatName": req.query.subCatId
        });
        res.json({ "data": data });
    } catch (error) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
    }
})

router.get("/getProduct", Auth, async (req, res) => {
    try {
        let limit = parseInt(req.query.limit);
        let offset = parseInt(req.query.offset);
        let searchString = req.query.search ? req.query.search : null;
        const totalDocs = await productModel.countDocuments(searchString ? { name: { $regex: searchString, $options: "i" } } : {});
        let pipeline = [
            {
                $lookup: {
                    from: "categories",
                    localField: "catName",
                    foreignField: "_id",
                    as: "catData"
                }
            },
            {
                $lookup: {
                    from: "subcategories",
                    localField: "subCatName",
                    foreignField: "_id",
                    as: "subCatData"
                }
            },
            {
                $lookup: {
                    from: "brands",
                    localField: "brandName",
                    foreignField: "_id",
                    as: "brandData"
                }
            },
            {
                $project: {
                    "catData.status": 0,
                    "catData._id": 0,
                    "catData.__v": 0,
                    "subCatData._id": 0,
                    "subCatData.__V": 0,
                    "subCatData.status": 0,
                    "subCatData.description": 0,
                    "brandData.catName": 0,
                    "brandData.subCatName": 0,
                    "brandData.image": 0,
                    "brandData._id": 0,
                    "brandData.status": 0,
                    "brandData.__v": 0,
                }
            },
            {
                $sort: { '_id': - 1 }
            }
        ];
        if (searchString) {
            pipeline.push(
                {
                    $match: {
                        $or: [
                            { name: { $regex: searchString, $options: "i" } }
                        ]
                    }
                }
            )
        }
        if (!searchString) {
            pipeline.push(
                {
                    $skip: offset
                },
                {
                    $limit: limit
                }
            )
        }
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

router.get("/product", Auth, async (req, res) => {
    try {
        const _id = req.query.id;
        const data = await productModel.findOne({ _id });
        oldThumbnail = data.thumbnail;
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

router.patch("/updateProduct", Auth, upload.single('pro_thumbnail'),
    async (req, res) => {
        try {
            let _id = req.query.id;
            let thumbnailPath = "";
            if (req.file) {
                thumbnailPath = `${req.file.destination}${req.file.filename}`;
            } else {
                thumbnailPath = oldThumbnail;
            }
            await productModel.findByIdAndUpdate(_id, {
                thumbnail: thumbnailPath,
                catName: req.body.catName,
                subCatName: req.body.subCatName,
                brandName: req.body.brandName,
                name: req.body.pro_name,
                desc: req.body.pro_desc,
                smallDesc: req.body.pro_small_desc
            });
            if (res.statusCode == 200) {
                if (req.file) {
                    if (fs.existsSync(oldThumbnail)) {
                        await fs.promises.unlink(oldThumbnail);
                    }
                }
                res.json({ "message": "Product Updated" });
            } else {
                res.status(500).json({ "message": "Unexpected error occurred" });
            }
        } catch (e) {
            console.log(e);
            res.status(500).json({ "message": e.toString() });
        }
    });


router.delete("/product/:id", Auth, async (req, res) => {
    try {
        const _id = new mongoose.Types.ObjectId(req.params.id);
        const singleData = await productModel.findOne(_id);
        let thumbnail = singleData.thumbnail;
        await productModel.findByIdAndDelete(_id);
        if (res.statusCode == 200) {
            if (fs.existsSync(thumbnail)) {
                await fs.promises.unlink(thumbnail);
            }
            res.json({ "message": "Product Deleted Successfully!" });
        } else {
            res.status(404).json({ "message": "Error in Deletion" });
        }
    } catch (error) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
        console.log(error);
    }
});

module.exports = router;