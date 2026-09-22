const pool = require('../../db');

/**
 * Service to insert a new assignment into the database
 * Uses parameterized SQL query. Default for submitted is false.
 */
const createAssignment = async (title, deadline) => {
  const query = `
    INSERT INTO assignments (title, deadline)
    VALUES ($1, $2)
    RETURNING id, title, deadline, submitted;
  `;
  const values = [title, deadline];
  const result = await pool.query(query, values);
  return result.rows[0];
};

module.exports = {
  createAssignment,
};
