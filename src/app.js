const express = require('express');

const app = express();

app.use(express.json());

const userRoutes = require("./routes/user.routes");

app.use("/users", userRoutes);

const errorHandler = require("./exceptions/errorHandler");
app.use(errorHandler);

module.exports = app;

