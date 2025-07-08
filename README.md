# Simple Face Attendance System

This is a simple desktop application for tracking attendance using face recognition. It allows users to register their faces and then mark attendance by recognizing their faces.

## Features

*   **Face Registration:** Capture a user's face, extract facial embeddings, and store them with the user's name.
*   **Face Recognition (Attendance):** Capture a live video feed, detect faces, recognize registered faces, and record attendance.
*   **Simple GUI:** A user-friendly interface for registration and attendance marking.

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
    *   **Windows:**
        ```bash
        .\venv\Scripts\activate
        ```
    *   **macOS/Linux:**
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

2.  **Register Faces:**
    *   Click the "Register Face" button.
    *   Enter the name of the person you want to register.
    *   Ensure only one face is in the camera frame and click "Capture and Register".

3.  **Mark Attendance:**
    *   Click the "Mark Attendance" button.
    *   The application will attempt to recognize faces in the camera feed.
    *   If a registered face is recognized, attendance will be marked and logged to `attendance_log.txt`.

## Project Structure

```
AttendanceApp/
├── aidocs/
│   └── 001_attendance_app_plan.md
├── src/
│   ├── main.py             # Main application logic and GUI
│   ├── face_utils.py       # Face detection, encoding, and recognition functions
│   └── data_manager.py     # Functions for saving/loading face data
├── data/
│   └── registered_faces.json # Stores face embeddings and names
│   └── haarcascade_frontalface_default.xml # Haar cascade file for face detection
├── requirements.txt        # Project dependencies
└── README.md               # Instructions to run the app
```

## Notes

*   This application uses `opencv-python` for face detection and recognition. The `LBPHFaceRecognizer` is used for recognition, which is simpler and less accurate than deep learning models. Performance and accuracy will depend on lighting, face angles, and the number of registered users.
*   Attendance records are currently printed to the console and saved to `attendance_log.txt` in the project root directory.
