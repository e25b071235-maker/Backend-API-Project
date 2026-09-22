const { Pool, types }=require('pg');
require('dotenv').config();

types.setTypeParser(1082, (val) => val);

const pool=new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'assignment_portal',
});

pool.on('error', (err) => {
  console.error('Database connection error', err);
});

module.exports=pool;
