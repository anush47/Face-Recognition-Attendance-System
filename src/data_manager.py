import json
import os
import base64
import numpy as np
import cv2
import csv

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'registered_faces.json')
CONFIG_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'config.json')
ATTENDANCE_LOG_FILE = os.path.join(os.path.dirname(__file__), '..', 'attendance_log.txt')

def _load_raw_face_data():
    """Loads raw face data from the JSON file."""
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def _save_raw_face_data(data):
    """Saves raw face data to the JSON file."""
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

def load_face_data():
    """Loads registered face data from the JSON file and decodes images."""
    raw_data = _load_raw_face_data()
    loaded_faces = []
    for entry in raw_data:
        img_bytes = base64.b64decode(entry['image'])
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_GRAYSCALE)
        loaded_faces.append({'id': entry.get('id'), 'name': entry['name'], 'image': img})
    return loaded_faces

def save_face_data(employee_id, name, face_image):
    """Saves a new face (ID, name, and image) to the JSON file."""
    data = _load_raw_face_data()
    if any(entry.get('id') == employee_id for entry in data):
        raise ValueError(f"Employee with ID {employee_id} already exists.")
    
    _, buffer = cv2.imencode('.png', face_image)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    
    data.append({'id': employee_id, 'name': name, 'image': img_base64})
    _save_raw_face_data(data)

def delete_face_data(employee_id):
    """Deletes a face by ID from the JSON file."""
    data = _load_raw_face_data()
    initial_len = len(data)
    data = [entry for entry in data if entry.get('id') != employee_id]
    if len(data) < initial_len:
        _save_raw_face_data(data)
        return True
    return False

def update_face_data(employee_id, new_name):
    """Updates a face's name by ID."""
    data = _load_raw_face_data()
    updated = False
    for entry in data:
        if entry.get('id') == employee_id:
            entry['name'] = new_name
            updated = True
            break
    if updated:
        _save_raw_face_data(data)
    return updated

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

def get_attendance_logs(name_or_id=None):
    """Reads and filters attendance logs."""
    logs = []
    if not os.path.exists(ATTENDANCE_LOG_FILE):
        return []
    with open(ATTENDANCE_LOG_FILE, 'r') as f:
        for line in f:
            logs.append(line.strip())
    
    if not name_or_id:
        return logs

    filtered_logs = []
    for log in logs:
        if name_or_id.lower() in log.lower():
            filtered_logs.append(log)
    return filtered_logs

def delete_attendance_log(log_to_delete):
    """Deletes a specific log entry from the attendance file."""
    if not os.path.exists(ATTENDANCE_LOG_FILE):
        return False
    
    with open(ATTENDANCE_LOG_FILE, 'r') as f:
        logs = f.readlines()
    
    # Normalize to ensure we handle entries with or without a trailing newline
    log_to_delete_normalized = log_to_delete.strip()
    
    original_count = len(logs)
    logs = [log for log in logs if log.strip() != log_to_delete_normalized]

    if len(logs) < original_count:
        with open(ATTENDANCE_LOG_FILE, 'w') as f:
            f.writelines(logs)
        return True
    return False

def edit_attendance_log(old_log, new_log):
    """Edits a specific log entry by replacing it."""
    if not os.path.exists(ATTENDANCE_LOG_FILE):
        return False
        
    with open(ATTENDANCE_LOG_FILE, 'r') as f:
        logs = f.readlines()

    old_log_normalized = old_log.strip()
    
    try:
        # Find the index of the log to edit
        index_to_edit = -1
        for i, log in enumerate(logs):
            if log.strip() == old_log_normalized:
                index_to_edit = i
                break
        
        if index_to_edit != -1:
            logs[index_to_edit] = new_log.strip() + '\n'
            with open(ATTENDANCE_LOG_FILE, 'w') as f:
                f.writelines(logs)
            return True
        else:
            return False # Log not found
            
    except ValueError:
        return False

def save_attendance_logs_to_csv(logs_data, output_filepath):
    """Saves attendance logs to a CSV file in the specified format."""
    fieldnames = ['employee', 'time']
    with open(output_filepath, 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for log_entry in logs_data:
            parts = log_entry.split(" - ")
            if len(parts) >= 3:
                employee_id = parts[1] # Assuming ID is the second part
                timestamp = " - ".join(parts[2:]) # Rejoin timestamp parts
                writer.writerow({'employee': employee_id, 'time': timestamp})