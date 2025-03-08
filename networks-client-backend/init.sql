-- Create USERS table
CREATE TABLE IF NOT EXISTS USERS (
    Username VARCHAR(255) PRIMARY KEY,
    Filepath TEXT
);

-- Example: Create a table for a specific user
CREATE TABLE IF NOT EXISTS john_doe (
    ImageId SERIAL PRIMARY KEY,
    FileName TEXT,
    DateUploaded DATE,
    DateTaken DATE,
    Location TEXT
);

-- Example insert into USERS table
INSERT INTO USERS (Username, Filepath)
VALUES ('john_doe', '/path/to/john_doe/folder')
ON CONFLICT (Username) DO NOTHING;