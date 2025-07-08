# Project Structure

```
AttendanceApp/
├── .venv/                    # Python virtual environment (created by `python -m venv venv`)
├── aidocs/                   # Documentation and planning documents
│   ├── 001_attendance_app_plan.md  # Detailed plan for the attendance application
│   ├── changelog.md          # Log of changes made by the Gemini agent
│   └── structure.md          # This document, detailing project structure
├── data/                     # Data storage for registered faces, configuration, and Haar cascade
│   ├── config.json           # Stores application configuration (e.g., admin credentials, attendance interval)
│   ├── registered_faces.json # Stores registered face data (names and base64 encoded images)
│   └── haarcascade_frontalface_default.xml # Haar cascade XML file for face detection
├── src/                      # Source code for the application
│   ├── main.py               # Main application logic and Tkinter GUI
│   ├── face_utils.py         # Functions for face detection, training, and recognition using OpenCV
│   └── data_manager.py       # Functions for saving and loading face data to/from JSON
├── attendance_log.txt        # Log file for marked attendance records
├── GEMINI.md                 # Instructions and guidelines for the Gemini CLI agent
├── README.md                 # Project overview, installation, and usage instructions
└── requirements.txt          # Python package dependencies
```
