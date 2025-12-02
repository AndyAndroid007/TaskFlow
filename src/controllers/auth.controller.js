const authService = require("../services/auth.service");

const login = async (req,res,next) => {
    try {
        const user = await authService.login(req.body);
        res.json(user);
    } catch(err) {
        next(err);
    }
};

module.exports = {login};