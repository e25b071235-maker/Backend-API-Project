const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controller');
const {
  validateCreateAssignment,
  validateSubmittedQuery,
} = require('../middlewares/validation.middleware');

// POST /assignments - Create Assignment
router.post('/', validateCreateAssignment, assignmentController.createAssignment);

// GET /assignments - View All Assignments (and filter by submitted)
router.get('/', validateSubmittedQuery, assignmentController.getAssignments);

module.exports = router;
