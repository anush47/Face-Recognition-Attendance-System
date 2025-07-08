# Detailed Plan for Simple Face Attendance System

## 1. Project Overview
*   **Name:** Simple Face Attendance System
*   **Description:** A desktop application for tracking attendance using face recognition. It will allow users to register their faces and then mark attendance by recognizing their faces.
*   **Core Features:**
    *   **Face Registration:** Capture a user's face, detect it, and store the detected face region with the user's name.
    *   **Face Recognition (Attendance):** Capture a live video feed, detect faces, compare with registered faces, and record attendance.
    *   **Simple GUI:** A user-friendly interface for registration and attendance marking.
*   **Constraints:**
    *   No GPU, CUDA, or CMake requirements.
    *   Minimal external libraries, primarily `opencv-python`.
    *   Easy installation via `pip install`.

## 2. Technology Stack
*   **Programming Language:** Python 3.x
*   **Face Detection & Recognition:** `opencv-python` (using Haar cascades for detection and `LBPHFaceRecognizer` for recognition).
*   **GUI:** `tkinter` (standard Python library, no external installation needed).
*   **Data Storage:** Simple JSON file for storing registered faces (image data and names).

## 3. Project Structure

```
AttendanceApp/
├── aidocs/
│   └── 001_attendance_app_plan.md
├── src/
│   ├── main.py             # Main application logic and GUI
│   ├── face_utils.py       # Face detection and recognition functions
│   └── data_manager.py     # Functions for saving/loading face data
├── data/
│   └── registered_faces.json # Stores face data and names
├── requirements.txt        # Project dependencies
└── README.md               # Instructions to run the app
```

## 4. Detailed Module Breakdown

*   **`src/main.py`**
    *   Initializes the `tkinter` GUI.
    *   Provides buttons for "Register Face" and "Mark Attendance".
    *   Handles camera access and display.
    *   Integrates with `face_utils.py` and `data_manager.py`.
    *   Displays messages to the user (e.g., "Face Registered!", "Attendance Marked for [Name]").

*   **`src/face_utils.py`**
    *   `face_cascade`: Loads OpenCV's Haar cascade for face detection.
    *   `recognizer`: Initializes OpenCV's `LBPHFaceRecognizer`.
    *   `detect_faces(image)`: Takes an image and returns a list of detected face regions (ROI).
    *   `train_recognizer(faces, names)`: Trains the `LBPHFaceRecognizer` with registered faces and names.
    *   `recognize_face(face_image)`: Predicts the name of a person from a given face image using the trained recognizer.

*   **`src/data_manager.py`**
    *   `save_face_data(name, face_image_base64)`: Appends a new face (name and base64 encoded image) to `data/registered_faces.json`.
    *   `load_face_data()`: Reads all registered face data from `data/registered_faces.json`.

## 5. Workflow

*   **Face Registration:**
    1.  User clicks "Register Face".
    2.  A new window or section appears, prompting for a name.
    3.  Camera feed starts.
    4.  When a face is detected, the system captures the face region.
    5.  The face image is saved (base64 encoded) with the name using `data_manager.save_face_data`.
    6.  The recognizer is retrained with the new data.
    7.  Confirmation message displayed.

*   **Face Recognition (Attendance):**
    1.  User clicks "Mark Attendance".
    2.  Camera feed starts.
    3.  Continuously detects faces in the feed using `face_utils.detect_faces`.
    4.  For each detected face, predicts the name using `face_utils.recognize_face`.
    5.  If recognized, records attendance (e.g., prints to console, or updates a simple log file).
    6.  Displays the recognized name on the screen.

## 6. `requirements.txt`

```
opencv-python
numpy
```

## 7. Installation and Running Instructions (to be included in `README.md`)

1.  Clone the repository: `git clone <repository_url>`
2.  Navigate to the project directory: `cd AttendanceApp`
3.  Create a virtual environment (recommended): `python -m venv venv`
4.  Activate the virtual environment:
    *   Windows: `venv\Scripts\activate`
    *   macOS/Linux: `source venv/bin/activate`
5.  Install dependencies: `pip install -r requirements.txt`
6.  Run the application: `python src/main.py`

## 8. Considerations and Potential Issues

*   **Accuracy:** `LBPHFaceRecognizer` is simpler and less accurate than deep learning models. Performance will depend on lighting, face angles, and the number of registered users.
*   **Data Persistence:** Using a simple JSON file is fine for a minimal prototype. For a production app, a proper database would be needed.
*   **Error Handling:** Basic error handling will be implemented (e.g., camera not found, no faces detected).
*   **Haar Cascade XML:** The Haar cascade XML file for face detection will need to be present and accessible. I will include it in the `data` directory or ensure it's downloaded if not found.