const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user exists (should be set by auth middleware)
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden - Insufficient permissions",
        requiredRole: allowedRoles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

module.exports = authorize;
