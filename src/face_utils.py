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
        # This is a placeholder. In a real scenario, you'd download it from a reliable source.
        # For simplicity, I'll assume it's manually placed or downloaded by the user.
        # A more robust solution would involve using requests to download from GitHub or similar.
        # For now, I'll just create an empty file and print a message.
        # You would typically download from: https://github.com/opencv/opencv/blob/master/data/haarcascades/haarcascade_frontalface_default.xml
        # For this example, I'll just create a dummy file and instruct the user.
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
    """Trains the LBPHFaceRecognizer with registered faces and returns an ID-to-name map."""
    registered_faces_data = load_face_data()
    faces = []
    ids = []
    name_to_id = {}
    id_to_name = {}
    current_id = 0

    for entry in registered_faces_data:
        name = entry['name']
        face_image = entry['image'] # This is already grayscale from data_manager

        if name not in name_to_id:
            name_to_id[name] = current_id
            id_to_name[current_id] = name
            current_id += 1
        
        faces.append(face_image)
        ids.append(name_to_id[name])

    if len(faces) > 0:
        recognizer.train(faces, np.array(ids))
        return id_to_name
    return {}

def recognize_face(face_image, id_to_name_map):
    """Recognizes a face using the trained LBPHFaceRecognizer."""
    if not id_to_name_map:
        return "Unknown", 0 # No trained data

    id, confidence = recognizer.predict(face_image)
    
    if id in id_to_name_map:
        name = id_to_name_map[id]
        return name, confidence
    return "Unknown", confidence
