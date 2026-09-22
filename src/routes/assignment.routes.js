const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controller');
const { validateCreateAssignment } = require('../middlewares/validation.middleware');

// POST /assignments - Create Assignment
router.post('/', validateCreateAssignment, assignmentController.createAssignment);

module.exports = router;
