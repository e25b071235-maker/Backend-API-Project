const validateCreateAssignment=(req, res, next) => {
  const { title, deadline }=req.body || {};

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ message: 'Title is required and must be a non-empty string' });
  }

  if (!deadline || typeof deadline !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
    return res.status(400).json({ message: 'Deadline is required and must be in YYYY-MM-DD format' });
  }

  next();
};

const validateIdParam=(req, res, next) => {
  const { id }=req.params;
  const parsedId=Number(id);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return res.status(400).json({ message: 'Assignment ID must be a positive integer' });
  }

  next();
};

const validateSubmittedQuery=(req, res, next) => {
  const { submitted }=req.query;
  if (submitted !== undefined && submitted !== 'true' && submitted !== 'false') {
    return res.status(400).json({ message: "Query parameter 'submitted' must be 'true' or 'false'" });
  }
  next();
};

module.exports={
  validateCreateAssignment,
  validateIdParam,
  validateSubmittedQuery,
};
