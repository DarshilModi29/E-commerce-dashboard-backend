const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");
const Auth = require("../middleware/Auth");
const jwt = require("jsonwebtoken");

router.post("/createUser", async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(req.body.password, salt);
        await userModel.create({
            username: req.body.username,
            email: req.body.email,
            password: secPass
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    };

})

router.post("/loginUser", async (req, res) => {
    try {
        let userData = await userModel.findOne({
            email: req.body.userEmail
        });
        if (!userData) {
            return res.status(400).json({ message: "Invalid Credentials ! Please enter valid credentials" });
        }

        const pwdCmp = await bcrypt.compare(req.body.userPass, userData.password);

        if (!pwdCmp) {
            return res.status(400).json({ message: "Invalid Credentials ! Please enter valid credentials" });
        }

        const data = {
            user: {
                id: userData._id
            }
        }
        const authToken = jwt.sign(data, process.env.SECRET_KEY);
        return res.json({ success: true, authToken: authToken });
    } catch (error) {
        res.status(500).json({ success: false, message: "Unexpected error occurred" });
    }
});

router.post("/forgotpassword", async (req, res) => {
    try {
        let userData = await userModel.findOne({
            email: req.body.user_email
        });

        if (!userData) {
            return res.status(400).json({ message: "Invalid Credentials ! Please enter valid credentials" });
        }

        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(req.body.new_pass, salt);

        await userModel.updateOne({ "email": req.body.user_email }, { $set: { "password": secPass } });
        return res.json({ succes: true, message: "Password has been changed" });

    } catch (error) {
        res.status(500).json({ success: false, message: "Unexpected error occurred" });
    }
})

router.post("/changePassword", Auth, async (req, res) => {
    try {
        let userData = await userModel.findOne({
            email: req.body.user_email
        });

        if (!userData) {
            return res.status(400).json({ message: "Invalid Credentials ! Please enter valid credentials" });
        }

        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(req.body.new_pass, salt);

        await userModel.updateOne({ "email": req.body.user_email }, { $set: { "password": secPass } });
        return res.json({ succes: true, message: "Password has been changed" });

    } catch (error) {
        res.status(500).json({ success: false, message: "Unexpected error occurred" });
    }
})

module.exports = router;