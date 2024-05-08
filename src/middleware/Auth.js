var jwt = require('jsonwebtoken');
const Auth = (req, res, next) => {
    try {
        const token = req.headers.authorization;
        var data = jwt.verify(token, process.env.SECRET_KEY)
        if (!data) {
            res.status(403).json({
                "message": "Access Denied",
            });
        } else {
            req._id = data.id;
            next();
        }
    } catch (error) {
        res.status(403).json({
            "message": "Access Denied",
        });
    }
}
module.exports = Auth;