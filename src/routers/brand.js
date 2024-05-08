const express = require("express");
const router = express.Router();
const brandModel = require("../models/brand");
const subCatModel = require("../models/subCategory");
const multer = require("multer");
const fs = require('fs');
const mongoose = require("mongoose");
const Auth = require("../middleware/Auth");
var oldFile;
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/brand_logo/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + file.originalname
        cb(null, uniqueSuffix)
    }
})
const upload = multer({ storage: storage, dest: "images/brand_logo/" })


router.post("/createBrand", Auth, upload.single("brandLogo"), async (req, res) => {
    try {
        let fullPath = `${req.file.destination}${req.file.filename}`;
        let brandData = new brandModel({
            image: fullPath,
            catName: req.body.catName,
            subCatName: req.body.subCatName,
            name: req.body.brandName,
            status: req.body.brandStatus
        });
        await brandData.save();
        if (res.statusCode == 200) {
            res.json({ "message": "Brand Created" });
        } else {
            res.statusCode(500).json({ "message": "Unexpected error occured" });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ "message": e.toString() });
    }
});

router.get("/getBrand", Auth, async (req, res) => {
    try {
        let limit = parseInt(req.query.limit);
        let offset = parseInt(req.query.offset);
        let searchString = req.query.search ? req.query.search : null;
        let totalDocs = await brandModel.countDocuments(searchString ? { name: { $regex: searchString, $options: "i" } } : {});
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
                $sort: { '_id': -1 }
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
                { $skip: offset },
                { $limit: limit }
            );
        }

        const data = await brandModel.aggregate(pipeline);
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

router.get("/brand", Auth, async (req, res) => {
    try {
        const _id = req.query.id;
        const data = await brandModel.findOne({ _id });
        oldFile = data.image;
        if (data) {
            res.json({ "data": data });
        } else {
            res.status(404).json({ "message": "No data found" });
        }
    } catch (e) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
    }
});

router.get("/subCat/brand", Auth, async (req, res) => {
    try {
        const data = await subCatModel.find({
            "catName": req.query.catId
        });
        res.json({ "data": data });
    } catch (error) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
    }
})

router.patch("/updateBrand", Auth, upload.single("brandLogo"), async (req, res) => {
    try {
        const _id = req.query.id;
        let fullPath = "";
        if (req.file) {
            fullPath = `${req.file.destination}${req.file.filename}`;
        } else {
            fullPath = oldFile;
        }
        await brandModel.findByIdAndUpdate(_id, {
            image: fullPath,
            catName: req.body.catName,
            subCatName: req.body.subCatName,
            name: req.body.brandName,
            status: req.body.brandStatus
        });
        if (res.statusCode == 200) {
            if (req.file) {
                if (fs.existsSync(oldFile)) {
                    await fs.promises.unlink(oldFile);
                }
            }
            res.json({ "message": "Brand Updated" });
        } else {
            res.status(500).json({ "message": "Unexpected Error Occured" });
        }
    } catch (e) {
        console.log(e.toString());
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
    }
});

router.delete("/brand/:id", Auth, async (req, res) => {
    try {
        const _id = new mongoose.Types.ObjectId(req.params.id);
        const singleData = await brandModel.findOne(_id);
        let image = singleData.image
        await brandModel.findByIdAndDelete(_id);
        if (res.statusCode == 200) {
            if (fs.existsSync(image)) {
                await fs.promises.unlink(image);
            }
            res.json({ "message": "Brand Deleted Successfully!" });
        } else {
            res.status(404).json({ "message": "Error in Deletion" });
        }
    } catch (error) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
        console.log(error.toString());
    }
});

module.exports = router;