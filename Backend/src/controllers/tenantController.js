const Tenant = require("../models/Tenant");

// Create Tenant
exports.createTenant = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Tenant name is required" });
    }

    const tenant = await Tenant.create({ name });

    res.status(201).json({
      message: "Tenant created successfully",
      tenant,
    });
  } catch (err) {
    err.statusCode = 500;
    err.message = "Error creating tenant";
    next(err);
  }
};

// Get all Tenants
exports.getTenants = async (req, res, next) => {
  try {
    const tenants = await Tenant.find();

    res.json({
      count: tenants.length,
      tenants,
    });
  } catch (err) {
    err.statusCode = 500;
    err.message = "Error fetching tenants";
    next(err);
  }
};