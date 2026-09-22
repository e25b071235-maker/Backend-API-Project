const pool=require('../../db');

const createAssignment=async (title, deadline) => {
  const query=`
    INSERT INTO assignments (title, deadline)
    VALUES ($1, $2)
    RETURNING id, title, deadline, submitted;
  `;
  const values=[title, deadline];
  const result=await pool.query(query, values);
  return result.rows[0];
};

const getAllAssignments=async (submitted) => {
  if (submitted !== undefined) {
    const isSubmitted=submitted === 'true';
    const query=`
      SELECT id, title, deadline, submitted
      FROM assignments
      WHERE submitted = $1
      ORDER BY id DESC;
    `;
    const result=await pool.query(query, [isSubmitted]);
    return result.rows;
  }

  const query=`
    SELECT id, title, deadline, submitted
    FROM assignments
    ORDER BY id DESC;
  `;
  const result=await pool.query(query);
  return result.rows;
};

const markAssignmentSubmitted=async (id) => {
  const query=`
    UPDATE assignments
    SET submitted = true
    WHERE id = $1
    RETURNING id, title, deadline, submitted;
  `;
  const result=await pool.query(query, [id]);
  return result.rows[0] || null;
};

const deleteAssignment=async (id) => {
  const query=`
    DELETE FROM assignments
    WHERE id = $1
    RETURNING *;
  `;
  const result=await pool.query(query, [id]);
  return result.rows[0] || null;
};

module.exports={
  createAssignment,
  getAllAssignments,
  markAssignmentSubmitted,
  deleteAssignment,
};
