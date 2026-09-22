const express=require('express');
const router=express.Router();
const assignmentController=require('../controllers/assignment.controller');
const {
  validateCreateAssignment,
  validateSubmittedQuery,
  validateIdParam,
}=require('../middlewares/validation.middleware');

router.post('/', validateCreateAssignment, assignmentController.createAssignment);
router.get('/', validateSubmittedQuery, assignmentController.getAssignments);
router.patch('/:id', validateIdParam, assignmentController.markAssignmentAsSubmitted);
router.delete('/:id', validateIdParam, assignmentController.deleteAssignment);

module.exports=router;
