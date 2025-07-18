# Changelog

- [2025-07-08 10:30:00] Task: Initial application setup. Created project structure, `requirements.txt`, `aidocs/001_attendance_app_plan.md`, `src/data_manager.py`, `src/face_utils.py`, `src/main.py`, and `README.md`.
- [2025-07-08 10:45:00] Task: Changed face recognition library from `face_recognition` to `opencv-python` (Haar cascades and LBPHFaceRecognizer) for Windows compatibility. Updated `aidocs/001_attendance_app_plan.md`, `requirements.txt`, `src/data_manager.py`, `src/face_utils.py`, `src/main.py`, and `README.md`.
- [2025-07-08 11:00:00] Task: Fixed import errors in `src/face_utils.py` and `src/main.py`. Updated `README.md` with `python -m src.main` command.
- [2025-07-08 11:15:00] Task: Fixed `AttributeError: module 'cv2' has no attribute 'face'` by correcting `opencv-python` to `opencv-contrib-python` in `requirements.txt`.
- [2025-07-08 11:30:00] Task: Created `aidocs/changelog.md`, `GEMINI.md`, and `aidocs/structure.md` as per user request.
- [2025-07-08 11:45:00] Task: Implemented core GUI and admin features. Created `data/config.json`. Updated `src/data_manager.py` with `delete_face_data`, `load_config`, `save_config`, and `get_attendance_logs` functions. Modified `src/main.py` to include admin login, `MainApplication` class, and initial GUI for face management (add, remove, view) with `remove_face_dialog` and `view_faces_dialog` implementations.
- [2025-07-08 12:00:00] Task: Improved attendance recording UI, implemented report dashboard, added admin settings, and included extensibility placeholders. Modified `src/main.py` to enhance `mark_attendance` with visual feedback, added `report_dashboard_window` with filtering, implemented `admin_settings_window` for configurable minimum capture interval, and added placeholder buttons for fingerprint and QR scan. Updated `src/data_manager.py` to support config loading/saving and attendance log retrieval.
- [2025-07-08 12:15:00] Task: Fixed `NameError: name 'load_config' is not defined` by correcting import in `src/main.py`. Modified login flow to allow attendance recording without admin login, while other admin features remain protected. Updated `src/main.py` to reflect these changes.
- [2025-07-09 12:00:00] Task: Implemented record editing and deletion for registered faces and attendance logs, added camera stop/resume functionality, and incorporated employee ID into registration and display. Modified `src/data_manager.py`, `src/face_utils.py`, and `src/main.py`.
- [2025-07-09 12:30:00] Task: Improved UI layout, made "Mark Attendance" button prominent, and ensured complete release of camera resources when stopped. Modified `src/main.py`.
- [2025-07-09 12:45:00] Task: Commented out fingerprint and QR buttons, and further improved UI layout, view, and feedback for various dialogs in `src/main.py`.
- [2025-07-09 13:00:00] Task: Adjusted UI layout to make camera preview smaller and positioned at the top, ensuring success/unsuccess messages are visible. Modified `src/main.py`.
- [2025-07-09 13:15:00] Task: Updated timestamp format in `attendance_log.txt` to `YYYY-MM-DDTHH:MM:SS.000Z`. Modified `src/main.py`.
- [2025-07-09 13:30:00] Task: Reverted attendance log handling to text file format and added "Save as CSV" button to attendance report. Modified `src/data_manager.py` and `src/main.py`.
- [2025-07-09 13:45:00] Task: Made the main window resizable and arranged the camera preview and buttons side-by-side for a better layout. Modified `src/main.py`.
- [2025-07-09 14:00:00] Task: Updated `README.md` to reflect all new features and changes. Modified `README.md`.
- [2025-07-09 14:05:00] Task: Modified imports in `src/main.py` and `src/face_utils.py` to allow direct execution of `src/main.py` without treating `src` as a package.
