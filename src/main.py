import tkinter as tk
from tkinter import messagebox, simpledialog, ttk
import cv2
from PIL import Image, ImageTk
import numpy as np
import os
from datetime import datetime

from .face_utils import detect_faces, train_recognizer, recognize_face
from .data_manager import save_face_data, load_face_data, delete_face_data, get_attendance_logs, load_config, save_config

class MainApplication:
    def __init__(self, master):
        self.master = master
        self.master.title("Face Attendance System")

        self.video_source = 0  # Default camera
        self.vid = cv2.VideoCapture(self.video_source)
        if not self.vid.isOpened():
            messagebox.showerror("Camera Error", "Unable to open video source")
            self.master.destroy()
            return

        self.canvas = tk.Canvas(master, width=self.vid.get(cv2.CAP_PROP_FRAME_WIDTH), height=self.vid.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.canvas.pack()

        self.btn_frame = tk.Frame(master)
        self.btn_frame.pack(pady=10)

        self.btn_attendance = tk.Button(self.btn_frame, text="Mark Attendance", width=20, command=self.mark_attendance)
        self.btn_attendance.pack(side=tk.LEFT, padx=5)

        self.btn_admin_login = tk.Button(self.btn_frame, text="Admin Login", width=20, command=self.open_admin_login_window)
        self.btn_admin_login.pack(side=tk.LEFT, padx=5)

        self.btn_register = tk.Button(self.btn_frame, text="Register Face", width=20, command=self.open_registration_window, state=tk.DISABLED)
        self.btn_register.pack(side=tk.LEFT, padx=5)

        self.btn_manage_faces = tk.Button(self.btn_frame, text="Manage Faces", width=20, command=self.manage_faces_window, state=tk.DISABLED)
        self.btn_manage_faces.pack(side=tk.LEFT, padx=5)

        self.btn_view_reports = tk.Button(self.btn_frame, text="View Reports", width=20, command=self.report_dashboard_window, state=tk.DISABLED)
        self.btn_view_reports.pack(side=tk.LEFT, padx=5)

        self.btn_admin_settings = tk.Button(self.btn_frame, text="Admin Settings", width=20, command=self.admin_settings_window, state=tk.DISABLED)
        self.btn_admin_settings.pack(side=tk.LEFT, padx=5)

        self.btn_fingerprint = tk.Button(self.btn_frame, text="Fingerprint Scan (Placeholder)", width=25, command=lambda: messagebox.showinfo("Info", "Fingerprint scanning functionality is a future enhancement."))
        self.btn_fingerprint.pack(side=tk.LEFT, padx=5)

        self.btn_qr_scan = tk.Button(self.btn_frame, text="QR Scan (Placeholder)", width=25, command=lambda: messagebox.showinfo("Info", "QR scanning functionality is a future enhancement."))
        self.btn_qr_scan.pack(side=tk.LEFT, padx=5)

        self.last_attendance_time = {}

        self.last_attendance_time = {}

        self.current_time_label = tk.Label(master, text="", font=("Helvetica", 16))
        self.current_time_label.pack(pady=5)

        self.status_label = tk.Label(master, text="", font=("Helvetica", 18, "bold"))
        self.status_label.pack(anchor=tk.CENTER, expand=True, pady=5)

        self.video_frame_border = self.canvas.create_rectangle(0, 0, 0, 0, outline="black", width=5)

        self.id_to_name_map = train_recognizer()

        self.delay = 10  # milliseconds
        self.update_frame()

        self.master.protocol("WM_DELETE_WINDOW", self.on_closing)

    def manage_faces_window(self):
        manage_window = tk.Toplevel(self.master)
        manage_window.title("Manage Faces")

        tk.Button(manage_window, text="Add Face", command=self.open_registration_window).pack(pady=10)
        tk.Button(manage_window, text="Remove Face", command=self.remove_face_dialog).pack(pady=10)
        tk.Button(manage_window, text="View Registered Faces", command=self.view_faces_dialog).pack(pady=10)

    def report_dashboard_window(self):
        report_window = tk.Toplevel(self.master)
        report_window.title("Attendance Report Dashboard")
        report_window.geometry("800x600")

        # Filter Frame
        filter_frame = tk.Frame(report_window)
        filter_frame.pack(pady=10)

        tk.Label(filter_frame, text="Filter by Name:").pack(side=tk.LEFT, padx=5)
        self.report_name_entry = tk.Entry(filter_frame)
        self.report_name_entry.pack(side=tk.LEFT, padx=5)

        tk.Button(filter_frame, text="Apply Filter", command=self.display_attendance_logs).pack(side=tk.LEFT, padx=5)

        # Treeview for logs
        self.log_tree = ttk.Treeview(report_window, columns=("Name", "Timestamp"), show="headings")
        self.log_tree.heading("Name", text="Name")
        self.log_tree.heading("Timestamp", text="Timestamp")
        self.log_tree.column("Name", width=200)
        self.log_tree.column("Timestamp", width=300)
        self.log_tree.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Scrollbar for Treeview
        log_scrollbar = ttk.Scrollbar(report_window, orient="vertical", command=self.log_tree.yview)
        log_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.log_tree.configure(yscrollcommand=log_scrollbar.set)

        self.display_attendance_logs() # Initial display

    def display_attendance_logs(self):
        for i in self.log_tree.get_children():
            self.log_tree.delete(i)

        filter_name = self.report_name_entry.get().strip()
        logs = get_attendance_logs(name=filter_name if filter_name else None)

        for log_entry in logs:
            parts = log_entry.split(" - ")
            if len(parts) == 2:
                name = parts[0]
                timestamp = parts[1]
                self.log_tree.insert("", "end", values=(name, timestamp))
            else:
                self.log_tree.insert("", "end", values=(log_entry, "Invalid Format"))

    def remove_face_dialog(self):
        remove_window = tk.Toplevel(self.master)
        remove_window.title("Remove Face")

        registered_faces = load_face_data()
        if not registered_faces:
            messagebox.showinfo("Info", "No faces registered yet.", parent=remove_window)
            remove_window.destroy()
            return

        tk.Label(remove_window, text="Select a face to remove:").pack(pady=5)

        listbox_frame = tk.Frame(remove_window)
        listbox_frame.pack(pady=5)

        scrollbar = tk.Scrollbar(listbox_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        self.face_listbox = tk.Listbox(listbox_frame, yscrollcommand=scrollbar.set)
        for face in registered_faces:
            self.face_listbox.insert(tk.END, face['name'])
        self.face_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.config(command=self.face_listbox.yview)

        def confirm_remove():
            selected_index = self.face_listbox.curselection()
            if not selected_index:
                messagebox.showwarning("Selection Error", "Please select a face to remove.", parent=remove_window)
                return

            name_to_remove = self.face_listbox.get(selected_index[0])
            if messagebox.askyesno("Confirm Removal", f"Are you sure you want to remove {name_to_remove}?", parent=remove_window):
                if delete_face_data(name_to_remove):
                    self.id_to_name_map = train_recognizer() # Retrain the recognizer
                    messagebox.showinfo("Success", f"Face for {name_to_remove} removed successfully!", parent=remove_window)
                    remove_window.destroy()
                else:
                    messagebox.showerror("Error", f"Failed to remove face for {name_to_remove}.", parent=remove_window)

        tk.Button(remove_window, text="Remove Selected", command=confirm_remove).pack(pady=10)

    def view_faces_dialog(self):
        view_window = tk.Toplevel(self.master)
        view_window.title("Registered Faces")

        registered_faces = load_face_data()
        if not registered_faces:
            messagebox.showinfo("Info", "No faces registered yet.", parent=view_window)
            view_window.destroy()
            return

        canvas_frame = tk.Frame(view_window)
        canvas_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        canvas = tk.Canvas(canvas_frame)
        canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        scrollbar = tk.Scrollbar(canvas_frame, orient="vertical", command=canvas.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        canvas.configure(yscrollcommand=scrollbar.set)
        canvas.bind('<Configure>', lambda e: canvas.configure(scrollregion = canvas.bbox("all")))

        inner_frame = tk.Frame(canvas)
        canvas.create_window((0, 0), window=inner_frame, anchor="nw")

        row = 0
        col = 0
        for face_data in registered_faces:
            name = face_data['name']
            face_image = face_data['image']

            # Resize image for thumbnail
            img_height, img_width = face_image.shape[:2]
            max_dim = 100
            if img_height > max_dim or img_width > max_dim:
                scaling_factor = max_dim / max(img_height, img_width)
                face_image = cv2.resize(face_image, (int(img_width * scaling_factor), int(img_height * scaling_factor)))

            # Convert OpenCV image to PhotoImage
            img_rgb = cv2.cvtColor(face_image, cv2.COLOR_GRAY2RGB) # Convert back to RGB for PIL
            img_pil = Image.fromarray(img_rgb)
            img_tk = ImageTk.PhotoImage(image=img_pil)

            frame = tk.Frame(inner_frame, borderwidth=1, relief="solid")
            frame.grid(row=row, column=col, padx=5, pady=5)

            label_img = tk.Label(frame, image=img_tk)
            label_img.image = img_tk # Keep a reference!
            label_img.pack()

            label_name = tk.Label(frame, text=name)
            label_name.pack()

            col += 1
            if col > 3: # 4 images per row
                col = 0
                row += 1

        view_window.update_idletasks()
        canvas.config(scrollregion=canvas.bbox("all"))
        

    def update_frame(self):
        ret, frame = self.vid.read()
        if ret:
            self.current_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Detect faces and draw rectangles
            faces, gray_frame = detect_faces(frame)
            for (x, y, w, h) in faces:
                cv2.rectangle(self.current_frame, (x, y), (x+w, y+h), (255, 0, 0), 2)

            self.photo = ImageTk.PhotoImage(image=Image.fromarray(self.current_frame))
            self.canvas.create_image(0, 0, image=self.photo, anchor=tk.NW)
            
            # Update current time label
            self.current_time_label.config(text=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

            # Update video frame border color (default to black)
            self.canvas.itemconfig(self.video_frame_border, outline="black")

        self.master.after(self.delay, self.update_frame)

    def open_admin_login_window(self):
        login_root = tk.Toplevel(self.master)
        login_root.title("Admin Login")
        login_root.geometry("300x150")
        login_root.resizable(False, False)

        username_label = tk.Label(login_root, text="Username:")
        username_label.pack(pady=5)
        username_entry = tk.Entry(login_root)
        username_entry.pack(pady=5)

        password_label = tk.Label(login_root, text="Password:")
        password_label.pack(pady=5)
        password_entry = tk.Entry(login_root, show="*")
        password_entry.pack(pady=5)

        def check_login():
            config = load_config()
            admin_username = config.get("admin_username", "admin")
            admin_password = config.get("admin_password", "admin")

            if username_entry.get() == admin_username and password_entry.get() == admin_password:
                messagebox.showinfo("Login Success", "Welcome Admin!")
                login_root.destroy()
                self.show_admin_features()
            else:
                messagebox.showerror("Login Failed", "Invalid username or password.")

        login_button = tk.Button(login_root, text="Login", command=check_login)
        login_button.pack(pady=10)

    def show_admin_features(self):
        self.btn_register.config(state=tk.NORMAL)
        self.btn_manage_faces.config(state=tk.NORMAL)
        self.btn_view_reports.config(state=tk.NORMAL)
        self.btn_admin_settings.config(state=tk.NORMAL)

    def open_registration_window(self):
        self.registration_window = tk.Toplevel(self.master)
        self.registration_window.title("Register New Face")

        tk.Label(self.registration_window, text="Enter Name:").pack(pady=5)
        self.name_entry = tk.Entry(self.registration_window)
        self.name_entry.pack(pady=5)

        tk.Button(self.registration_window, text="Capture and Register", command=self.register_face).pack(pady=10)

    def register_face(self):
        name = self.name_entry.get().strip()
        if not name:
            messagebox.showwarning("Input Error", "Please enter a name.", parent=self.registration_window)
            return

        if self.current_frame is not None:
            faces, gray_frame = detect_faces(self.current_frame)

            if len(faces) > 1:
                messagebox.showwarning("Registration Error", "Multiple faces detected. Please ensure only one face is in the frame.", parent=self.registration_window)
            elif len(faces) == 0:
                messagebox.showwarning("Registration Error", "No face detected. Please ensure your face is clearly visible.", parent=self.registration_window)
            else:
                (x, y, w, h) = faces[0]
                face_image = gray_frame[y:y+h, x:x+w] # Get the face region in grayscale
                save_face_data(name, face_image)
                self.id_to_name_map = train_recognizer() # Retrain the recognizer with new data
                messagebox.showinfo("Success", f"Face for {name} registered successfully!", parent=self.registration_window)
                self.registration_window.destroy()
        else:
            messagebox.showerror("Error", "No frame available. Make sure camera is working.", parent=self.registration_window)

    def mark_attendance(self):
        if self.current_frame is not None:
            faces, gray_frame = detect_faces(self.current_frame)

            if len(faces) == 0:
                self.status_label.config(text="No face detected for attendance.", fg="red")
                return

            for (x, y, w, h) in faces:
                face_image = gray_frame[y:y+h, x:x+w]
                name, confidence = recognize_face(face_image, self.id_to_name_map)
                
                if name != "Unknown":
                    current_time = datetime.now()
                    config = load_config()
                    min_interval = config.get("min_capture_interval_minutes", 5) # Default to 5 minutes

                    if name in self.last_attendance_time:
                        time_difference = (current_time - self.last_attendance_time[name]).total_seconds() / 60
                        if time_difference < min_interval:
                            self.status_label.config(text=f"{name} already marked attendance recently. Please wait {min_interval - int(time_difference)} minutes.", fg="orange")
                            self.canvas.itemconfig(self.video_frame_border, outline="orange")
                            continue # Skip marking attendance for this person

                    timestamp = current_time.strftime("%Y-%m-%d %H:%M:%S")
                    attendance_record = f"{name} - {timestamp}"
                    print(f"Attendance Marked: {attendance_record}")
                    self.status_label.config(text=f"Attendance Marked for: {name}", fg="green")
                    self.canvas.itemconfig(self.video_frame_border, outline="green")
                    # Optionally, save attendance to a log file
                    with open("attendance_log.txt", "a") as f:
                        f.write(attendance_record + "\n")
                    self.last_attendance_time[name] = current_time
                else:
                    self.status_label.config(text=f"Unknown face detected.", fg="red")
                    self.canvas.itemconfig(self.video_frame_border, outline="red")
        else:
            self.status_label.config(text="No frame available. Make sure camera is working.", fg="red")

    def admin_settings_window(self):
        settings_window = tk.Toplevel(self.master)
        settings_window.title("Admin Settings")

        config = load_config()
        min_interval = config.get("min_capture_interval_minutes", 5) # Default to 5 minutes

        tk.Label(settings_window, text="Minimum Capture Interval (minutes):").pack(pady=5)
        self.min_interval_entry = tk.Entry(settings_window)
        self.min_interval_entry.insert(0, str(min_interval))
        self.min_interval_entry.pack(pady=5)

        def save_admin_settings():
            try:
                new_interval = int(self.min_interval_entry.get().strip())
                if new_interval <= 0:
                    messagebox.showwarning("Input Error", "Interval must be a positive integer.", parent=settings_window)
                    return
                
                config["min_capture_interval_minutes"] = new_interval
                save_config(config)
                messagebox.showinfo("Success", "Settings saved successfully!", parent=settings_window)
                settings_window.destroy()
            except ValueError:
                messagebox.showwarning("Input Error", "Please enter a valid number for the interval.", parent=settings_window)

        tk.Button(settings_window, text="Save Settings", command=save_admin_settings).pack(pady=10)

    def on_closing(self):
        if self.vid.isOpened():
            self.vid.release()
        self.master.destroy()

# Main execution
if __name__ == "__main__":
    root = tk.Tk()
    app = MainApplication(root)
    root.mainloop()
