CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    deadline DATE NOT NULL,
    submitted BOOLEAN DEFAULT false
);
