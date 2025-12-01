module.exports = (err,req,res,next) => {
    console.error(err.stack);

    return res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
};