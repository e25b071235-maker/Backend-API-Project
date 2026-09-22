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

/**
 * Controller to handle GET /assignments
 * Supports optional ?submitted=true / ?submitted=false
 * Returns 200 with list of assignments
 */
const getAssignments = async (req, res, next) => {
  try {
    const { submitted } = req.query;
    const assignments = await assignmentService.getAllAssignments(submitted);
    res.status(200).json(assignments);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle PATCH /assignments/:id
 * Sets submitted = true for the given assignment id
 * Returns 200 with updated assignment, or 404 if not found
 */
const markAssignmentAsSubmitted = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedAssignment = await assignmentService.markAssignmentSubmitted(Number(id));

    if (!updatedAssignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.status(200).json(updatedAssignment);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  markAssignmentAsSubmitted,
};
