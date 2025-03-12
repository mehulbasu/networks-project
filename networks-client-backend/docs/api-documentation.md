# API Documentation

## Overview

This Express.js application provides REST API endpoints for managing users and their images in a PostgreSQL database. The application handles user creation and image management operations.

## Endpoints

### 1. Home Route

- **Route**: `GET /`
- **Description**: Renders the index page
- **Response**: Renders index view with title 'Express'

### 2. Create User

- **Route**: `POST /users`
- **Description**: Creates a new user and their corresponding image table
- **Request Body**:
  ```json
  {
    "username": "string",
    "filepath": "string"
  }
  ```
- **Response**:
  - Success (200):
    ```json
    {
      "message": "User created",
      "user": {
        "username": "string",
        "filepath": "string"
      }
    }
    ```
  - Error (500):
    ```json
    {
      "error": "error message"
    }
    ```

### 3. Add Image

- **Route**: `POST /images/:username`
- **Description**: Adds a new image entry to a user's table
- **Parameters**:
  - `username` (path parameter): User's identifier
- **Request Body**:
  ```json
  {
    "fileName": "string",
    "dateTaken": "date",
    "location": "string"
  }
  ```
- **Response**:
  - Success (200): Returns the created image record
  - Error (500):
    ```json
    {
      "error": "error message"
    }
    ```

### 4. Get User Images

- **Route**: `GET /images/:username`
- **Description**: Retrieves all images for a specific user
- **Parameters**:
  - `username` (path parameter): User's identifier
- **Response**:
  - Success (200): Array of image records
  - Error (500):
    ```json
    {
      "error": "error message"
    }
    ```

## Error Handling

- 404 errors are caught and forwarded to the error handler
- Development environment shows detailed error information
- Production environment shows basic error message

## Middleware

- Morgan logger for HTTP request logging
- JSON body parser
- URL-encoded body parser
- Cookie parser
- Static file serving from 'public' directory

## Dependencies

- express
- http-errors
- path
- cookie-parser
- morgan
- jade (view engine)

## Database Integration

The application uses a PostgreSQL database through the `dbUtils` module for all data operations. Database configuration is handled separately in the database configuration files.
