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

/**
 * Service to fetch assignments from the database
 * Supports filtering by submitted status and orders newest first (ORDER BY id DESC)
 * Uses parameterized SQL query when submitted filter is provided.
 */
const getAllAssignments = async (submitted) => {
  if (submitted !== undefined) {
    const isSubmitted = submitted === 'true';
    const query = `
      SELECT id, title, deadline, submitted
      FROM assignments
      WHERE submitted = $1
      ORDER BY id DESC;
    `;
    const result = await pool.query(query, [isSubmitted]);
    return result.rows;
  }

  const query = `
    SELECT id, title, deadline, submitted
    FROM assignments
    ORDER BY id DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
};

module.exports = {
  createAssignment,
  getAllAssignments,
};
