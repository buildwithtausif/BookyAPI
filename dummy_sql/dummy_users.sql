-- Drop the table if it already exists to avoid errors
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
);

INSERT INTO users ("name", email) 
VALUES 
    ('Atisha', 'atishaa788@gmail.com'),
    ('Anushka', 'anushka.srivastava1502@gmail.com'),
    ('Prakshi', 'prakshi.p1r40@gmail.com'),
    ('Divyanshi', 'divyanshimudgal.04@gmail.com'),
    ('Piyush', 'piyushhero110@gmail.com'),
    ('Ashmeet', 'ashmeetsingh27p@gmail.com'),
    ('Tausif', 'ta9967896@gmail.com'),
    ('Arsalaan', 'arsalaan.akhtr@gmail.com');