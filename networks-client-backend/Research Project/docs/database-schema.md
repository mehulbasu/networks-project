# Database Schema Documentation

## Tables Overview

### 1. USERS Table

The main table that stores user information and their associated file paths.

**Schema:**

```sql
CREATE TABLE IF NOT EXISTS USERS (
    Username VARCHAR(255) PRIMARY KEY,
    Filepath TEXT
);
```

**Fields:**

- `Username`: Primary key, unique identifier for each user
- `Filepath`: The base directory path where the user's files are stored

### 2. User-Specific Image Tables

Each user gets their own table for storing image metadata. The table name matches the username.

**Schema Example:**

```sql
CREATE TABLE IF NOT EXISTS <username> (
    ImageId SERIAL PRIMARY KEY,
    FileName TEXT,
    DateUploaded DATE,
    DateTaken DATE,
    Location TEXT
);
```

**Fields:**

- `ImageId`: Auto-incrementing primary key
- `FileName`: Name of the image file
- `DateUploaded`: Date when the image was uploaded to the system
- `DateTaken`: Original date when the image was taken
- `Location`: Geographic location or path information

## Usage Examples

### Adding a New User

```sql
INSERT INTO USERS (Username, Filepath)
VALUES ('john_doe', '/path/to/john_doe/folder')
ON CONFLICT (Username) DO NOTHING;
```

### Adding an Image to User's Table

```sql
INSERT INTO john_doe (FileName, DateUploaded, DateTaken, Location)
VALUES ('vacation.jpg', CURRENT_DATE, '2023-12-25', 'Paris, France');
```

### Querying User's Images

```sql
SELECT * FROM john_doe ORDER BY DateUploaded DESC;
```

## Important Notes

1. User tables are created dynamically when a new user is registered
2. Username in USERS table serves as both primary key and reference for user-specific tables
3. The ON CONFLICT clause prevents duplicate user entries
4. DateUploaded is automatically set to current date during insertion
