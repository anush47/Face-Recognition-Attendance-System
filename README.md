# Simple Face Attendance System

This is a simple desktop application for tracking attendance using face recognition. It allows users to register their faces and then mark attendance by recognizing their faces.

## Features

- **Face Registration:** Capture a user's face, extract facial embeddings, and store them with the user's name and a unique employee ID.
- **Face Recognition (Attendance):** Capture a live video feed, detect faces, recognize registered faces, and record attendance with employee ID and a precise timestamp.
- **Admin Panel:** Secure login for administrators to manage various aspects of the system.
- **Manage Registered Faces:** Add, edit (name), remove, and view registered employee faces.
- **Attendance Report Dashboard:** View, filter, edit, and delete attendance log entries.
- **Export Attendance Data:** Save attendance reports to a CSV file with employee ID and timestamp.
- **Camera Control:** Stop and resume the camera feed as needed, with proper resource management.
- **Configurable Settings:** Adjust application settings like minimum attendance capture interval.
- **Improved User Interface:** Resizable window with a clean layout, displaying the camera feed and controls side-by-side, and clear visual feedback.

## Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd AttendanceApp
    ```

    (Replace `<repository_url>` with the actual URL of your repository if you are cloning from a remote source. If you downloaded the files directly, navigate to the `AttendanceApp` directory.)

2.  **Create a virtual environment (recommended):**

    ```bash
    python -m venv venv
    ```

3.  **Activate the virtual environment:**

    - **Windows:**
      ```bash
      .\venv\Scripts\activate
      ```
    - **macOS/Linux:**
      ```bash
      source venv/bin/activate
      ```

4.  **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

5.  **Download Haar Cascade XML:**
    This application uses OpenCV's Haar cascades for face detection. You need to download the `haarcascade_frontalface_default.xml` file and place it in the `data/` directory.
    You can download it from the OpenCV GitHub repository: [https://github.com/opencv/opencv/blob/master/data/haarcascades/haarcascade_frontalface_default.xml](https://github.com/opencv/opencv/blob/master/data/haarcascades/haarcascade_frontalface_default.xml)

## Usage

1.  **Run the application:**
    From the root directory of the project (`AttendanceApp/`), run:

    ```bash
    python -m src.main
    ```

2.  **Admin Login:**

    - Click "Admin Login" to access administrative features.
    - Default credentials: Username `admin`, Password `admin` (can be changed in Admin Settings).

3.  **Register Faces:**

    - Log in as Admin.
    - Click the "Register Face" button.
    - Enter a unique Employee ID and the Name of the person.
    - Ensure only one face is in the camera frame and click "Capture and Register".

4.  **Mark Attendance:**

    - Click the "Mark Attendance" button.
    - The application will attempt to recognize faces in the camera feed.
    - If a registered face is recognized, attendance will be marked and logged to `attendance_log.txt`.

5.  **Manage Faces:**

    - Log in as Admin.
    - Click "Manage Faces" to add, edit, remove, or view registered faces.

6.  **View Reports:**

    - Log in as Admin.
    - Click "View Reports" to access the Attendance Report Dashboard.
    - You can filter logs by Name/ID, edit existing log entries, delete log entries, and save the report as a CSV file.

7.  **Camera Control:**
    - Use the "Stop Camera" and "Resume Camera" buttons to control the video feed.

## Project Structure

```
AttendanceApp/
├── aidocs/                   # Documentation and planning documents
│   ├── 001_attendance_app_plan.md  # Detailed plan for the attendance application
│   ├── changelog.md          # Log of changes made by the Gemini agent
│   ├── file_descriptions.md  # Describes the purpose of each file in the project
│   └── structure.md          # This document, detailing project structure
├── data/                     # Data storage for registered faces, configuration, and Haar cascade
│   ├── config.json           # Stores application configuration (e.g., admin credentials, attendance interval)
│   ├── registered_faces.json # Stores registered face data (employee ID, names and base64 encoded images)
│   └── haarcascade_frontalface_default.xml # Haar cascade XML file for face detection
├── src/                      # Source code for the application
│   ├── main.py               # Main application logic and Tkinter GUI
│   ├── face_utils.py         # Functions for face detection, training, and recognition using OpenCV
│   └── data_manager.py       # Functions for saving and loading face data to/from JSON, and managing attendance logs
├── attendance_log.txt        # Log file for marked attendance records
├── GEMINI.md                 # Instructions and guidelines for the Gemini CLI agent
├── README.md                 # Project overview, installation, and usage instructions
└── requirements.txt          # Python package dependencies
```

## Notes

- This application uses `opencv-python` for face detection and recognition. The `LBPHFaceRecognizer` is used for recognition, which is simpler and less accurate than deep learning models. Performance and accuracy will depend on lighting, face angles, and the number of registered users.
- Attendance records are saved to `attendance_log.txt` in the project root directory in the format `Name - EmployeeID - YYYY-MM-DDTHH:MM:SS.000Z`.
- The attendance report can be exported to a CSV file with `employee` (ID) and `time` (timestamp in `YYYY-MM-DDTHH:MM:SS.000Z`) columns.
- This application was mainly developed using gemini-cli
