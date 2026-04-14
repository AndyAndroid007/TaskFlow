const express = require('express');
const cors = require('cors');
const correlationId = require('./middlewares/correlationId');
const passport = require('./config/passport');
const httpLogger = require('./middlewares/httpLogger');

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(correlationId);
app.use(httpLogger);
app.use(express.json());
app.use(passport.initialize());

const userRoutes = require("./routes/user.routes");
const authRoutes = require("./routes/auth.routes");
const taskRoutes = require("./routes/task.routes");
const eventRoutes = require("./routes/event.routes");
const analyticsRoutes = require("./routes/analytics.routes");

app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);
app.use("/events", eventRoutes);
app.use("/analytics", analyticsRoutes);

const errorHandler = require("./exceptions/errorHandler");
app.use(errorHandler);

module.exports = app;
