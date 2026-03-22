const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// REGISTER
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, tenantId } = req.body;

    if (!name || !email || !password || !tenantId)
      return res.status(400).json({ message: "All fields required (tenantId required)" });

    const existingUser = await User.findOne({ email, tenantId });
    if (existingUser)
      return res.status(400).json({ message: "User already exists in this tenant" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      tenantId,
      name,
      email,
      password: hashedPassword,
      role: role || "member", // Allow role to be set, defaults to member
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId },
    });
  } catch (err) {
    err.statusCode = 500;
    err.message = "Registration failed";
    next(err);
  }
};

// LOGIN
exports.login = async (req, res, next) => {
  try {
    const { email, password, tenantId } = req.body;

    if (!tenantId) {
      return res.status(400).json({ message: "tenantId is required" });
    }

    const user = await User.findOne({ email, tenantId });
    if (!user)
      return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role, tenantId: user.tenantId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    err.statusCode = 500;
    err.message = "Login failed";
    next(err);
  }
};

// UPDATE USER ROLE (Admin only)
exports.updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["admin", "manager", "member"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, tenantId: req.user.tenantId },
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User role updated", user });
  } catch (err) {
    err.statusCode = 500;
    err.message = "Error updating role";
    next(err);
  }
};
