const assignmentService = require('../services/assignment.service');

/**
 * Controller to handle POST /assignments
 * Expects { title, deadline } in req.body
 * Returns 201 with newly created assignment
 */
const createAssignment = async (req, res, next) => {
  try {
    const { title, deadline } = req.body;
    const newAssignment = await assignmentService.createAssignment(title, deadline);
    res.status(201).json(newAssignment);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAssignment,
};
