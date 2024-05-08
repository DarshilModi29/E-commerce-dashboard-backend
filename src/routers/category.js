const express = require("express");
const router = express.Router();
const catModel = require("../models/category");
const Auth = require("../middleware/Auth");

router.post("/createCategory", Auth, async (req, res) => {
    try {
        let catData = new catModel({
            name: req.body.catName,
            status: req.body.catStatus
        });
        await catData.save();
        if (res.statusCode == 200) {
            res.json({ "message": "Category Created" });
        } else {
            res.statusCode(500).json({ "message": "Unexpected error occured" });
        }
    } catch (e) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
    }
});

router.get("/getCategory", Auth, async (req, res) => {
    try {
        let limit = parseInt(req.query.limit);
        let offset = parseInt(req.query.offset);
        let searchString = req.query.search ? req.query.search : null;
        const totalCount = await catModel.countDocuments(searchString ? { name: { $regex: searchString, $options: "i" } } : {});
        var data = [];
        if (!searchString) {
            data = await catModel.find({}).
                sort([['_id', -1]]).skip(offset).limit(limit).exec();
        } else {
            data = await catModel.find({
                "$or": [
                    { name: { $regex: searchString, $options: "i" } }
                ]
            }).sort([['_id', -1]]).exec();
        }
        if (data.length > 0) {
            res.json({ "data": data, "total": totalCount });
        } else {
            res.json({ "message": "No category available" });
        }
    } catch (e) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
        console.log(e);
    }
});

router.get("/category", Auth, async (req, res) => {
    try {
        const _id = req.query.id;
        const data = await catModel.findOne({ _id });
        if (data) {
            res.json({ "data": data });
        } else {
            res.status(404).json({ "message": "No data found" });
        }
    } catch (e) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
    }
});

router.patch("/updateCategory", Auth, async (req, res) => {
    try {
        const _id = req.query.id;
        await catModel.findByIdAndUpdate(_id, {
            name: req.body.catName,
            status: req.body.catStatus
        });
        if (res.statusCode == 200) {
            res.json({ "message": "Category Updated" });
        } else {
            res.status(500).json({ "message": "Unexpected Error Occured" });
        }
    } catch (e) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
    }
});

router.delete("/category/:id", Auth, async (req, res) => {
    try {
        const _id = req.params.id;
        await catModel.findByIdAndDelete(_id);
        if (res.statusCode == 200) {
            res.json({ "message": "Category Deleted Successfully!" });
        } else {
            res.status(404).json({ "message": "Error in Deletion" });
        }
    } catch (error) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
    }
});

module.exports = router;