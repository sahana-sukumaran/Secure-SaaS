const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const errorHandler = require("./middleware/error_handler");
const path = require('path');
const uploadRoutes = require('./routes/uploadRoutes');

require("dotenv").config();

const app = express();

/* ---------- Security & middlewares ---------- */
app.use(helmet());

app.use(cors({
  origin: "http://localhost:3000", // React frontend
  credentials: true
}));

app.use(express.json());
app.set('trust proxy', 1);

/* ---------- Rate limiting ---------- */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

/* ---------- Routes ---------- */
const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const activityRoutes = require("./routes/activityRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects", taskRoutes);
app.use("/api/activities", activityRoutes);

// Upload route and serve uploaded files
app.use(uploadRoutes);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

/* ---------- Health check ---------- */
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend running securely" });
});

/* ---------- Root ---------- */
app.get("/", (req, res) => {
  res.send("API is running securely");
});
app.get("/api/some-endpoint", (req, res) => {
  res.json({ message: "Hello from backend" });
});

/* ---------- Global Error Handler (LAST) ---------- */
app.use(errorHandler);

/* ---------- Server start ---------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

module.exports = app;
