const ApiError = require("../exceptions/ApiError");
const validate = (schema) => (req,res,next) => {
    const {error} = schema.validate(req.body);

    if (error) {
        return next(new ApiError(400, error.details[0].message));
    }

    next();
}

module.exports = validate;