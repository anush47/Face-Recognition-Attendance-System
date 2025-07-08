import json
import os
import base64
import numpy as np
import cv2

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'registered_faces.json')
CONFIG_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'config.json')
ATTENDANCE_LOG_FILE = os.path.join(os.path.dirname(__file__), '..', 'attendance_log.txt')

def load_face_data():
    """Loads registered face data from the JSON file."""
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r') as f:
        data = json.load(f)
    
    # Decode base64 image data back to OpenCV format
    loaded_faces = []
    for entry in data:
        img_bytes = base64.b64decode(entry['image'])
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_GRAYSCALE) # Assuming grayscale for LBPH
        loaded_faces.append({'name': entry['name'], 'image': img})
    return loaded_faces

def save_face_data(name, face_image):
    """Saves a new face (name and image) to the JSON file."""
    data = []
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)

    # Encode image to base64 for JSON storage
    _, buffer = cv2.imencode('.png', face_image) # Encode as PNG
    img_base64 = base64.b64encode(buffer).decode('utf-8')

    data.append({'name': name, 'image': img_base64})
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

def delete_face_data(name):
    """Deletes a face by name from the JSON file."""
    data = load_face_data()
    initial_len = len(data)
    data = [entry for entry in data if entry['name'] != name]
    if len(data) < initial_len: # If something was actually removed
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f, indent=4)
        return True
    return False

def load_config():
    """Loads configuration data from the JSON file."""
    if not os.path.exists(CONFIG_FILE):
        return {}
    with open(CONFIG_FILE, 'r') as f:
        return json.load(f)

def save_config(config_data):
    """Saves configuration data to the JSON file."""
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config_data, f, indent=4)

def get_attendance_logs(start_date=None, end_date=None, name=None):
    """Reads and filters attendance logs."""
    logs = []
    if not os.path.exists(ATTENDANCE_LOG_FILE):
        return []
    with open(ATTENDANCE_LOG_FILE, 'r') as f:
        for line in f:
            logs.append(line.strip())
    
    # Basic filtering (can be expanded)
    filtered_logs = []
    for log in logs:
        include_log = True
        if name and name.lower() not in log.lower():
            include_log = False
        # Date filtering would require parsing the date from the log line
        # For now, only name filtering is implemented.
        if include_log:
            filtered_logs.append(log)
    return filtered_logs
