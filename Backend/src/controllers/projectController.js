const Project = require("../models/Project");
const { logActivity } = require("../utils/activityLogger");

// CREATE PROJECT
exports.createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Project name required" });
    }

    const project = await Project.create({
      tenantId: req.user.tenantId,
      name,
      description,
      owner: req.user.id,
      members: [{ user: req.user.id, role: "owner" }],
    });

    // Log activity
    await logActivity(req.user.id, "CREATE_PROJECT", "Project", project._id, {
      tenantId: req.user.tenantId,
      details: `Created project: ${name}`,
    });

    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (err) {
    err.statusCode = 500;
    err.message = "Error creating project";
    next(err);
  }
};

// GET ALL PROJECTS FOR USER
exports.getUserProjects = async (req, res, next) => {
  try {
    // Find projects where user is owner or member
    const projects = await Project.find({
      tenantId: req.user.tenantId,
      $or: [
        { owner: req.user.id },
        { "members.user": req.user.id },
      ],
    })
      .populate("owner", "name email")
      .populate("members.user", "name email");

    res.json({
      message: "Projects retrieved",
      count: projects.length,
      projects,
    });
  } catch (err) {
    err.statusCode = 500;
    err.message = "Error fetching projects";
    next(err);
  }
};

// GET PROJECT BY ID
exports.getProjectById = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({ _id: projectId, tenantId: req.user.tenantId })
      .populate("owner", "name email")
      .populate("members.user", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is member or owner
    const isMember = project.owner.equals(req.user.id) ||
      project.members.some(m => m.user._id.equals(req.user.id));

    if (!isMember) {
      return res.status(403).json({ message: "Access denied to this project" });
    }

    res.json({ message: "Project retrieved", project });
  } catch (err) {
    err.statusCode = 500;
    err.message = "Error fetching project";
    next(err);
  }
};

// UPDATE PROJECT (Only owner or manager)
exports.updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, description, status } = req.body;

    const project = await Project.findOne({ _id: projectId, tenantId: req.user.tenantId });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is owner
    if (!project.owner.equals(req.user.id)) {
      return res.status(403).json({ message: "Only project owner can update" });
    }

    if (name) project.name = name;
    if (description) project.description = description;
    if (status) project.status = status;

    await project.save();

    // Log activity
    await logActivity(req.user.id, "UPDATE_PROJECT", "Project", project._id, {
      tenantId: req.user.tenantId,
      details: `Updated project: ${project.name}`,
    });

    res.json({ message: "Project updated", project });
  } catch (err) {
    err.statusCode = 500;
    err.message = "Error updating project";
    next(err);
  }
};

// DELETE PROJECT (Only owner)
exports.deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

const project = await Project.findOne({ _id: projectId, tenantId: req.user.tenantId });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.owner.equals(req.user.id)) {
  return res.status(403).json({ message: "Only project owner can delete" });
}

// Log activity ✅ only after permission check
await logActivity(req.user.id, "DELETE_PROJECT", "Project", projectId, {
      tenantId: req.user.tenantId,
});

await Project.findOneAndDelete({ _id: projectId, tenantId: req.user.tenantId });


    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    err.statusCode = 500;
    err.message = "Error deleting project";
    next(err);
  }
};

// ADD MEMBER TO PROJECT (Only owner)
exports.addMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { userId, role } = req.body;

    const project = await Project.findOne({ _id: projectId, tenantId: req.user.tenantId });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.owner.equals(req.user.id)) {
      return res.status(403).json({ message: "Only owner can add members" });
    }

    // Check if user exists and belongs to same tenant
    const user = await require("../models/User").findOne({ _id: userId, tenantId: req.user.tenantId });
    if (!user) {
      return res.status(404).json({ message: "User not found or belongs to a different tenant" });
    }

    // Check if member already exists
    const memberExists = project.members.some(m => m.user.equals(userId));
    if (memberExists) {
      return res.status(400).json({ message: "User already a member" });
    }

    project.members.push({
      user: userId,
      role: role || "member",
    });

    await project.save();
    await project.populate("members.user", "name email");

    // Log activity
    await logActivity(req.user.id, "ADD_MEMBER", "Project", projectId, {
      tenantId: req.user.tenantId,
      details: `Added member to project: ${project.name}`,
    });

    res.json({ message: "Member added to project", project });
  } catch (err) {
    err.statusCode = 500;
    err.message = "Error adding member";
    next(err);
  }
};
