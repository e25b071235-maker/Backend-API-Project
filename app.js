const express = require('express');
require('dotenv').config();

const assignmentRoutes = require('./src/routes/assignment.routes');
const errorHandler = require('./src/middlewares/errorHandler.middleware');

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Mount routes
app.use('/assignments', assignmentRoutes);

// Catch-all route for undefined paths
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Centralized error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
