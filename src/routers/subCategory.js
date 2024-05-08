const express = require("express");
const router = express.Router();
const subCatModel = require("../models/subCategory");
const Auth = require("../middleware/Auth");

router.post("/createSubCategory", Auth, async (req, res) => {
    try {
        let subCatData = new subCatModel({
            catName: req.body.catName,
            name: req.body.subCatName,
            description: req.body.subCatDesc,
            status: req.body.subCatStatus
        });
        await subCatData.save();
        if (res.statusCode == 200) {
            res.json({ "message": "Sub Category Created" });
        } else {
            res.statusCode(500).json({ "message": "Unexpected error occured" });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
    }
});

router.get("/getSubCategory", Auth, async (req, res) => {
    try {
        let limit = parseInt(req.query.limit);
        let offset = parseInt(req.query.offset);
        let searchString = req.query.search ? req.query.search : null;
        const totalDocs = await subCatModel.countDocuments(searchString ? { name: { $regex: searchString, $options: "i" } } : {});
        let pipeline = [
            {
                $lookup: {
                    from: "categories",
                    localField: "catName",
                    foreignField: "_id",
                    as: "subCatData"
                }
            },
            {
                $sort: { '_id': - 1 }
            }
        ]
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
        const data = await subCatModel.aggregate(pipeline);
        if (data.length > 0) {
            res.json({ "data": data, "total": totalDocs });
        } else {
            res.json({ "message": "No sub category available" });
        }
    } catch (e) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
        console.log(e);
    }
});

router.get("/subCategory", Auth, async (req, res) => {
    try {
        const _id = req.query.id;
        const data = await subCatModel.findOne({ _id });
        if (data) {
            res.json({ "data": data });
        } else {
            res.status(404).json({ "message": "No data found" });
        }
    } catch (e) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
    }
});

router.patch("/updateSubCategory", Auth, async (req, res) => {
    try {
        const _id = req.query.id;
        await subCatModel.findByIdAndUpdate(_id, {
            catName: req.body.catName,
            name: req.body.subCatName,
            description: req.body.subCatDesc,
            status: req.body.subCatStatus
        });
        if (res.statusCode == 200) {
            res.json({ "message": "Sub Category Updated" });
        } else {
            res.status(500).json({ "message": "Unexpected Error Occured" });
        }
    } catch (e) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
    }
});

router.delete("/subCategory/:id", Auth, async (req, res) => {
    try {
        const _id = req.params.id;
        await subCatModel.findByIdAndDelete(_id);
        if (res.statusCode == 200) {
            res.json({ "message": "Sub Category Deleted Successfully!" });
        } else {
            res.status(404).json({ "message": "Error in Deletion" });
        }
    } catch (error) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
    }
});

module.exports = router;