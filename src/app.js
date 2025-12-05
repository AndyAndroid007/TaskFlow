const express = require('express');

const app = express();

app.use(express.json());

const userRoutes = require("./routes/user.routes");
const authRoutes = require("./routes/auth.routes");
const taskRoutes = require("./routes/task.routes");

app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);

const errorHandler = require("./exceptions/errorHandler");
app.use(errorHandler);

module.exports = app;

