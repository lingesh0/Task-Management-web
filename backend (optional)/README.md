# Task Management Web App Backend

This is the backend for the Task Management Web Application built using FastAPI. The backend provides an API for managing tasks and user authentication through Firebase.

## Features

- FastAPI framework for building the API.
- CORS middleware to allow cross-origin requests.
- Endpoints for task management (CRUD operations).
- Integration with Firebase for authentication and Firestore database.

## Getting Started

### Prerequisites

- Python 3.7 or higher
- pip (Python package installer)

### Installation

1. Clone the repository:

   git clone <repository-url>

2. Navigate to the backend directory:

   cd task-management-app/backend

3. Install the required dependencies:

   pip install -r requirements.txt

### Running the Application

To run the FastAPI application, use the following command:

uvicorn main:app --reload

The application will be available at `http://127.0.0.1:8000`.

### API Endpoints

- `GET /api/tasks`: Retrieve a list of tasks.

### Deployment

For deployment instructions, refer to the main project README or Firebase documentation for hosting.

## License

This project is licensed under the MIT License. See the LICENSE file for details.