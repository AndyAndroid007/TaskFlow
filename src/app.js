const express = require('express');

const app = express();

app.use(express.json());

const userRoutes = require("./routes/user.routes");
const authRoutes = require("./routes/auth.routes");

app.use("/users", userRoutes);
app.use("/auth", authRoutes);

const errorHandler = require("./exceptions/errorHandler");
app.use(errorHandler);

module.exports = app;

