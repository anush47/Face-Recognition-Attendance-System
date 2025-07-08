# File Descriptions

This document provides a brief description of each file and directory within the project.

## Root Directory

-   `.gitignore`: Specifies intentionally untracked files that Git should ignore.
-   `attendance_log.txt`: Stores a log of all marked attendance records.
-   `GEMINI.md`: Contains instructions and guidelines for the Gemini CLI agent.
-   `README.md`: Provides a general overview of the project, installation instructions, and usage details.
-   `requirements.txt`: Lists the Python package dependencies required for the project.

## `aidocs/` Directory

-   `aidocs/001_attendance_app_plan.md`: Details the initial plan and technical choices for the attendance application.
-   `aidocs/changelog.md`: Logs all significant changes and updates made to the project by the Gemini agent.
-   `aidocs/structure.md`: Describes the overall folder and file structure of the project.
-   `aidocs/file_descriptions.md`: This document, detailing the purpose of each file.

## `data/` Directory

-   `data/config.json`: Stores application configuration settings, such as admin credentials and minimum attendance capture intervals.
-   `data/haarcascade_frontalface_default.xml`: The Haar cascade XML file used by OpenCV for face detection.
-   `data/registered_faces.json`: Stores the data for registered faces, including employee IDs, names, and base64 encoded face images.

## `src/` Directory

-   `src/main.py`: The main application script, containing the Tkinter GUI and orchestrating the overall attendance system logic.
-   `src/face_utils.py`: Provides utility functions for face detection, training the face recognizer, and recognizing faces using OpenCV.
-   `src/data_manager.py`: Handles data persistence, including saving and loading registered face data and managing attendance logs.
