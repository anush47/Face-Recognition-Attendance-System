import cv2
import numpy as np
import os
from src.data_manager import load_face_data

# Path to Haar cascade XML file
HAAR_CASCADE_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'haarcascade_frontalface_default.xml')

# Download Haar cascade if not present
if not os.path.exists(HAAR_CASCADE_PATH):
    print("Downloading haarcascade_frontalface_default.xml...")
    try:
        with open(HAAR_CASCADE_PATH, 'w') as f:
            f.write("") # Create an empty file as a placeholder
        print(f"Please download 'haarcascade_frontalface_default.xml' and place it in the 'data/' directory.")
        print(f"You can find it here: https://github.com/opencv/opencv/blob/master/data/haarcascades/haarcascade_frontalface_default.xml")
    except Exception as e:
        print(f"Error downloading Haar cascade: {e}")

face_cascade = cv2.CascadeClassifier(HAAR_CASCADE_PATH)
recognizer = cv2.face.LBPHFaceRecognizer_create() # type: ignore

def detect_faces(image):
    """Detects faces in an image using Haar cascades."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    return faces, gray

def train_recognizer():
    """Trains the LBPHFaceRecognizer with registered faces and returns an ID-to-employee_info map."""
    registered_faces_data = load_face_data()
    faces = []
    ids = []
    employee_id_to_internal_id = {}
    internal_id_to_employee_info = {}
    current_internal_id = 0

    for entry in registered_faces_data:
        employee_id = entry['id']
        name = entry['name']
        face_image = entry['image']

        if employee_id not in employee_id_to_internal_id:
            employee_id_to_internal_id[employee_id] = current_internal_id
            internal_id_to_employee_info[current_internal_id] = {'id': employee_id, 'name': name}
            current_internal_id += 1
        
        faces.append(face_image)
        ids.append(employee_id_to_internal_id[employee_id])

    if len(faces) > 0:
        recognizer.train(faces, np.array(ids))
        return internal_id_to_employee_info
    return {}

def recognize_face(face_image, internal_id_to_employee_info_map):
    """Recognizes a face using the trained LBPHFaceRecognizer."""
    if not internal_id_to_employee_info_map:
        return {'id': 'Unknown', 'name': 'Unknown'}, 0 # No trained data

    internal_id, confidence = recognizer.predict(face_image)
    
    if internal_id in internal_id_to_employee_info_map:
        employee_info = internal_id_to_employee_info_map[internal_id]
        return employee_info, confidence
    return {'id': 'Unknown', 'name': 'Unknown'}, confidence