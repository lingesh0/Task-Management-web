# Task Management Web App - Frontend

This is the frontend of the Task Management Web Application built using React.js with Vite. The application allows users to manage tasks with features such as authentication, real-time updates, and CRUD operations.

## Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Home.jsx          # Welcome page
│   │   ├── Login.jsx         # Login form using Firebase Authentication
│   │   ├── Register.jsx      # Registration form using Firebase Authentication
│   │   ├── Dashboard.jsx      # Task list with CRUD operations
│   │   ├── TaskDetail.jsx     # Detailed task information
│   │   ├── Profile.jsx        # User profile information
│   │   └── NotFound.jsx       # 404 error page
│   ├── components/
│   │   ├── Navbar.jsx         # Navigation bar with auth links
│   │   └── TaskCard.jsx       # Individual task display with edit/delete options
│   ├── firebase.js            # Firebase configuration and initialization
│   ├── App.jsx                # Main application component with routing
│   └── main.jsx               # Entry point of the application
├── package.json                # Project metadata and dependencies
├── vite.config.js             # Vite configuration settings
└── README.md                  # Documentation for the frontend application
```

## Features

- **User Authentication**: Users can register and log in using Firebase Authentication.
- **Task Management**: Users can create, read, update, and delete tasks.
- **Real-time Updates**: The application supports real-time updates using Firestore.
- **Responsive Design**: The UI is designed to be responsive and user-friendly.

## Getting Started

1. Clone the repository:
   ```
   git clone <repository-url>
   cd task-management-app/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up Firebase:
   - Create a Firebase project and configure authentication and Firestore.
   - Update the `firebase.js` file with your Firebase configuration.

4. Run the application:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000` to view the application.

## Deployment

To deploy the frontend application to Firebase Hosting, follow these steps:

1. Install Firebase CLI:
   ```
   npm install -g firebase-tools
   ```

2. Log in to Firebase:
   ```
   firebase login
   ```

3. Initialize Firebase in the project:
   ```
   firebase init
   ```

4. Deploy the application:
   ```
   firebase deploy
   ```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or features.

## License

This project is licensed under the MIT License. See the LICENSE file for details.