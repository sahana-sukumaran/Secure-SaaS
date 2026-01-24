const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const app = express();
app.use(helmet());
app.use(express.json());
const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.get("/", (req, res) => {
  res.send("API is running securely");
});
module.exports = app;