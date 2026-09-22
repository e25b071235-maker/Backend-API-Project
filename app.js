const express=require('express');
require('dotenv').config();

const assignmentRoutes=require('./src/routes/assignment.routes');
const errorHandler=require('./src/middlewares/errorHandler.middleware');

const app=express();

app.use(express.json());

app.use('/assignments', assignmentRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

const PORT=process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports=app;
