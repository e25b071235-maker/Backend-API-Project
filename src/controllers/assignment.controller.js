const assignmentService=require('../services/assignment.service');

const createAssignment=async (req, res, next) => {
  try {
    const { title, deadline }=req.body;
    const newAssignment=await assignmentService.createAssignment(title, deadline);
    res.status(201).json(newAssignment);
  } catch (error) {
    next(error);
  }
};

const getAssignments=async (req, res, next) => {
  try {
    const { submitted }=req.query;
    const assignments=await assignmentService.getAllAssignments(submitted);
    res.status(200).json(assignments);
  } catch (error) {
    next(error);
  }
};

const markAssignmentAsSubmitted=async (req, res, next) => {
  try {
    const { id }=req.params;
    const updatedAssignment=await assignmentService.markAssignmentSubmitted(Number(id));

    if (!updatedAssignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.status(200).json(updatedAssignment);
  } catch (error) {
    next(error);
  }
};

const deleteAssignment=async (req, res, next) => {
  try {
    const { id }=req.params;
    const deletedAssignment=await assignmentService.deleteAssignment(Number(id));

    if (!deletedAssignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.status(200).json({
      message: 'Assignment deleted successfully',
      assignment: deletedAssignment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports={
  createAssignment,
  getAssignments,
  markAssignmentAsSubmitted,
  deleteAssignment,
};
