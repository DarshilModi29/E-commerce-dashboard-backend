const express = require("express");
const router = express.Router();
const varModel = require("../models/variationTypes");
const Auth = require("../middleware/Auth");

router.post("/createVariation", Auth, async (req, res) => {
    try {
        let varData = new varModel({
            name: req.body.var_name,
            var_values: req.body.var_values
        });
        await varData.save();
        if (res.statusCode == 200) {
            res.json({ "message": "Variation Created" });
        } else {
            res.statusCode(500).json({ "message": "Unexpected error occured" });
        }
    } catch (e) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
    }
});

router.get("/getVariation", Auth, async (req, res) => {
    try {
        let limit = parseInt(req.query.limit);
        let offset = parseInt(req.query.offset);
        let searchString = req.query.search ? req.query.search : null;
        if (!searchString) {
            data = await varModel.find({}).
                sort([['_id', -1]]).skip(offset).limit(limit).exec();
        } else {
            data = await varModel.find({
                "$or": [
                    { name: { $regex: searchString, $options: "i" } },
                    { var_values: { $regex: searchString, $options: "i" } }
                ]
            }).sort([['_id', -1]]).exec();
        }
        const totalDocs = await varModel.countDocuments(searchString ?
            {
                "$or": [
                    { name: { $regex: searchString, $options: "i" } },
                    { var_values: { $regex: searchString, $options: "i" } }
                ]
            }
            : {});
        if (data.length > 0) {
            res.json({ "data": data, "total": totalDocs });
        } else {
            res.json({ "message": "No Variation available" });
        }
    } catch (e) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
    }
});

router.get("/variation", Auth, async (req, res) => {
    try {
        const _id = req.query.id;
        const data = await varModel.findOne({ _id });
        if (data) {
            res.json({ "data": data });
        } else {
            res.status(404).json({ "message": "No data found" });
        }
    } catch (e) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
    }
});

router.patch("/updateVariation", Auth, async (req, res) => {
    try {
        const _id = req.query.id;
        await varModel.findByIdAndUpdate(_id, {
            name: req.body.var_name,
            var_values: req.body.var_values
        });
        if (res.statusCode == 200) {
            res.json({ "message": "Variation Updated" });
        } else {
            res.status(500).json({ "message": "Unexpected Error Occured" });
        }
    } catch (e) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
    }
});

router.delete("/variation/:id", Auth, async (req, res) => {
    try {
        const _id = req.params.id;
        await varModel.findByIdAndDelete(_id);
        if (res.statusCode == 200) {
            res.json({ "message": "Variation Deleted Successfully!" });
        } else {
            res.status(404).json({ "message": "Error in Deletion" });
        }
    } catch (error) {
        res.status(500).json({ "message": "Internal Server Error ! Please Try Later" });
    }
});

module.exports = router;