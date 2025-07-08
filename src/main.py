import tkinter as tk
from tkinter import messagebox, simpledialog, ttk
import cv2
from PIL import Image, ImageTk
from datetime import datetime

from face_utils import detect_faces, train_recognizer, recognize_face
from data_manager import delete_attendance_log, edit_attendance_log, save_attendance_logs_to_csv, save_face_data, load_face_data, delete_face_data, get_attendance_logs, load_config, save_config, update_face_data

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

        self.master.title("Face Attendance System")

        self.video_source = 0  # Default camera
        self.vid = cv2.VideoCapture(self.video_source)
        if not self.vid.isOpened():
            messagebox.showerror("Camera Error", "Unable to open video source")
            self.master.destroy()
            return

        # Allow resizing
        self.master.resizable(True, True)

        # Main container frame using grid
        self.main_container = tk.Frame(self.master)
        self.main_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Configure grid weights for resizing
        self.main_container.grid_columnconfigure(0, weight=1) # Camera column
        self.main_container.grid_columnconfigure(1, weight=0) # Buttons column
        self.main_container.grid_rowconfigure(0, weight=1)

        # Left frame for camera feed and status messages
        self.camera_frame = tk.Frame(self.main_container)
        self.camera_frame.grid(row=0, column=0, sticky="nsew", padx=5, pady=5)
        self.camera_frame.grid_rowconfigure(0, weight=1)
        self.camera_frame.grid_columnconfigure(0, weight=1)

        # Camera preview canvas
        self.canvas_width = 640
        self.canvas_height = 480
        self.canvas = tk.Canvas(self.camera_frame, width=self.canvas_width, height=self.canvas_height, bg="black")
        self.canvas.grid(row=0, column=0, sticky="nsew")

        self.current_time_label = tk.Label(self.camera_frame, text="", font=("Helvetica", 16))
        self.current_time_label.grid(row=1, column=0, pady=5)

        self.status_label = tk.Label(self.camera_frame, text="", font=("Helvetica", 18, "bold"), wraplength=self.canvas_width)
        self.status_label.grid(row=2, column=0, pady=5)

        self.video_frame_border = self.canvas.create_rectangle(0, 0, 0, 0, outline="black", width=5)

        # Right frame for all buttons
        self.buttons_frame = tk.Frame(self.main_container)
        self.buttons_frame.grid(row=0, column=1, sticky="ns", padx=5, pady=5)

        # Main button frame (Mark Attendance and Camera controls)
        self.main_btn_frame = tk.Frame(self.buttons_frame)
        self.main_btn_frame.pack(pady=10)

        self.btn_attendance = tk.Button(self.main_btn_frame, text="Mark Attendance", font=("Helvetica", 16, "bold"), bg="#4CAF50", fg="white", width=20, command=self.mark_attendance)
        self.btn_attendance.grid(row=0, column=0, columnspan=2, pady=10)

        # Camera control buttons
        self.camera_btn_frame = tk.Frame(self.main_btn_frame)
        self.camera_btn_frame.grid(row=1, column=0, columnspan=2, pady=5)
        self.btn_stop_camera = tk.Button(self.camera_btn_frame, text="Stop Camera", width=15, command=self.stop_camera)
        self.btn_stop_camera.pack(side=tk.LEFT, padx=5)
        self.btn_resume_camera = tk.Button(self.camera_btn_frame, text="Resume Camera", width=15, command=self.resume_camera, state=tk.DISABLED)
        self.btn_resume_camera.pack(side=tk.LEFT, padx=5)

        # Admin and other features
        self.admin_btn_frame = tk.Frame(self.buttons_frame)
        self.admin_btn_frame.pack(pady=10)

        self.btn_admin_login = tk.Button(self.admin_btn_frame, text="Admin Login", width=20, command=self.open_admin_login_window)
        self.btn_admin_login.grid(row=0, column=0, padx=5, pady=5)

        self.btn_register = tk.Button(self.admin_btn_frame, text="Register Face", width=20, command=self.open_registration_window, state=tk.DISABLED)
        self.btn_register.grid(row=0, column=1, padx=5, pady=5)

        self.btn_manage_faces = tk.Button(self.admin_btn_frame, text="Manage Faces", width=20, command=self.manage_faces_window, state=tk.DISABLED)
        self.btn_manage_faces.grid(row=1, column=0, padx=5, pady=5)

        self.btn_view_reports = tk.Button(self.admin_btn_frame, text="View Reports", width=20, command=self.report_dashboard_window, state=tk.DISABLED)
        self.btn_view_reports.grid(row=1, column=1, padx=5, pady=5)

        self.btn_admin_settings = tk.Button(self.admin_btn_frame, text="Admin Settings", width=20, command=self.admin_settings_window, state=tk.DISABLED)
        self.btn_admin_settings.grid(row=2, column=0, padx=5, pady=5)

        # self.btn_fingerprint = tk.Button(self.admin_btn_frame, text="Fingerprint Scan (Placeholder)", width=25, command=lambda: messagebox.showinfo("Info", "Fingerprint scanning functionality is a future enhancement."))
        # self.btn_fingerprint.grid(row=2, column=1, padx=5, pady=5)

        # self.btn_qr_scan = tk.Button(self.admin_btn_frame, text="QR Scan (Placeholder)", width=25, command=lambda: messagebox.showinfo("Info", "QR scanning functionality is a future enhancement."))
        # self.btn_qr_scan.grid(row=3, column=0, columnspan=2, pady=5)

        self.last_attendance_time = {}

        self.id_to_employee_info_map = train_recognizer()

        self.delay = 10  # milliseconds
        self.camera_active = True
        self.update_frame()

        self.master.protocol("WM_DELETE_WINDOW", self.on_closing)

    def manage_faces_window(self):
        manage_window = tk.Toplevel(self.master)
        manage_window.title("Manage Faces")
        manage_window.geometry("300x250") # Fixed size
        manage_window.transient(self.master) # Make it appear on top of the main window
        manage_window.grab_set() # Make it modal

        tk.Button(manage_window, text="Add Face", command=self.open_registration_window).pack(pady=10)
        #tk.Button(manage_window, text="Edit Face", command=self.edit_face_dialog).pack(pady=10)
        tk.Button(manage_window, text="Remove Face", command=self.remove_face_dialog).pack(pady=10)
        tk.Button(manage_window, text="View Registered Faces", command=self.view_faces_dialog).pack(pady=10)

        manage_window.protocol("WM_DELETE_WINDOW", manage_window.destroy) # Allow closing with X button

    def report_dashboard_window(self):
        report_window = tk.Toplevel(self.master)
        report_window.title("Attendance Report Dashboard")
        report_window.geometry("900x600")
        report_window.transient(self.master)
        report_window.grab_set()

        # Filter Frame
        filter_frame = tk.Frame(report_window)
        filter_frame.pack(pady=10)

        tk.Label(filter_frame, text="Filter by Name/ID:").pack(side=tk.LEFT, padx=5)
        self.report_name_entry = tk.Entry(filter_frame)
        self.report_name_entry.pack(side=tk.LEFT, padx=5)

        tk.Button(filter_frame, text="Apply Filter", command=self.display_attendance_logs).pack(side=tk.LEFT, padx=5)

        # Treeview for logs
        self.log_tree = ttk.Treeview(report_window, columns=("Name", "ID", "Timestamp"), show="headings")
        self.log_tree.heading("Name", text="Name")
        self.log_tree.heading("ID", text="ID")
        self.log_tree.heading("Timestamp", text="Timestamp")
        self.log_tree.column("Name", width=200)
        self.log_tree.column("ID", width=100)
        self.log_tree.column("Timestamp", width=250)
        self.log_tree.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Scrollbar for Treeview
        log_scrollbar = ttk.Scrollbar(report_window, orient="vertical", command=self.log_tree.yview)
        log_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.log_tree.configure(yscrollcommand=log_scrollbar.set)

        # Action Buttons for Reports
        report_action_frame = tk.Frame(report_window)
        report_action_frame.pack(pady=10)

        tk.Button(report_action_frame, text="Edit Selected Log", command=self.edit_attendance_log_dialog).pack(side=tk.LEFT, padx=5)
        tk.Button(report_action_frame, text="Delete Selected Log", command=self.delete_attendance_log_dialog).pack(side=tk.LEFT, padx=5)
        tk.Button(report_action_frame, text="Save as CSV", command=self.save_report_as_csv).pack(side=tk.LEFT, padx=5)

        self.display_attendance_logs() # Initial display

        report_window.protocol("WM_DELETE_WINDOW", report_window.destroy) # Allow closing with X button

    def display_attendance_logs(self):
        for i in self.log_tree.get_children():
            self.log_tree.delete(i)

        filter_value = self.report_name_entry.get().strip()
        logs = get_attendance_logs(name_or_id=filter_value if filter_value else None)

        for log_entry in logs:
            parts = log_entry.split(" - ")
            if len(parts) >= 3: # Expecting "Name - ID - Timestamp"
                name = parts[0]
                employee_id = parts[1]
                timestamp = " - ".join(parts[2:]) # Rejoin timestamp parts
                self.log_tree.insert("", "end", values=(name, employee_id, timestamp), tags=(log_entry,)) # Store raw log in tags
            else:
                self.log_tree.insert("", "end", values=(log_entry, "", ""), tags=(log_entry,)) # Fallback for old format

    def save_report_as_csv(self):
        logs_to_export = []
        for item in self.log_tree.get_children():
            # Retrieve the raw log entry stored in tags
            raw_log = self.log_tree.item(item, 'tags')[0]
            logs_to_export.append(raw_log)

        if not logs_to_export:
            messagebox.showinfo("Info", "No attendance records to export.")
            return

        # Ask user for save location
        file_path = simpledialog.askstring("Save CSV", "Enter filename (e.g., attendance.csv):")
        if file_path:
            try:
                save_attendance_logs_to_csv(logs_to_export, file_path)
                messagebox.showinfo("Success", f"Attendance report saved to {file_path}")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to save CSV: {e}")

    def edit_attendance_log_dialog(self):
        selected_item = self.log_tree.selection()
        if not selected_item:
            messagebox.showwarning("Selection Error", "Please select an attendance log to edit.")
            return

        # Retrieve the raw log entry from tags
        old_log_raw = self.log_tree.item(selected_item[0], 'tags')[0]

        edit_log_window = tk.Toplevel(self.master)
        edit_log_window.title("Edit Attendance Log")
        edit_log_window.geometry("500x250") # Fixed size
        edit_log_window.transient(self.master)
        edit_log_window.grab_set()

        tk.Label(edit_log_window, text="Original Log:").pack(pady=5)
        tk.Label(edit_log_window, text=old_log_raw, wraplength=400).pack(pady=5)

        tk.Label(edit_log_window, text="New Log (e.g., Name - ID - YYYY-MM-DD HH:MM:SS):").pack(pady=5)
        self.new_log_entry = tk.Entry(edit_log_window, width=50)
        self.new_log_entry.insert(0, old_log_raw) # Pre-fill with old log
        self.new_log_entry.pack(pady=5)

        def confirm_edit_log():
            new_log_text = self.new_log_entry.get().strip()
            if not new_log_text:
                messagebox.showwarning("Input Error", "New log cannot be empty.", parent=edit_log_window)
                return
            
            if messagebox.askyesno("Confirm Edit", "Are you sure you want to update this log entry?", parent=edit_log_window):
                if edit_attendance_log(old_log_raw, new_log_text):
                    messagebox.showinfo("Success", "Attendance log updated successfully!", parent=edit_log_window)
                    self.display_attendance_logs() # Refresh the display
                    edit_log_window.destroy()
                else:
                    messagebox.showerror("Error", "Failed to update attendance log.", parent=edit_log_window)

        tk.Button(edit_log_window, text="Save Changes", command=confirm_edit_log).pack(pady=10)

        edit_log_window.protocol("WM_DELETE_WINDOW", edit_log_window.destroy)

    def delete_attendance_log_dialog(self):
        selected_item = self.log_tree.selection()
        if not selected_item:
            messagebox.showwarning("Selection Error", "Please select an attendance log to delete.")
            return

        # Retrieve the raw log entry from tags
        log_to_delete_raw = self.log_tree.item(selected_item[0], 'tags')[0]

        if messagebox.askyesno("Confirm Deletion", f"Are you sure you want to delete this log entry?\n\n{log_to_delete_raw}"):
            if delete_attendance_log(log_to_delete_raw):
                messagebox.showinfo("Success", "Attendance log deleted successfully!")
                self.display_attendance_logs() # Refresh the display
            else:
                messagebox.showerror("Error", "Failed to delete attendance log.")

    def remove_face_dialog(self):
        remove_window = tk.Toplevel(self.master)
        remove_window.title("Remove Face")
        remove_window.geometry("400x300") # Fixed size
        remove_window.transient(self.master)
        remove_window.grab_set()

        registered_faces = load_face_data()
        if not registered_faces:
            messagebox.showinfo("Info", "No faces registered yet.", parent=remove_window)
            remove_window.destroy()
            return

        tk.Label(remove_window, text="Select a face to remove: ").pack(pady=5)

        listbox_frame = tk.Frame(remove_window)
        listbox_frame.pack(pady=5, fill=tk.BOTH, expand=True)

        scrollbar = tk.Scrollbar(listbox_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        self.face_listbox = tk.Listbox(listbox_frame, yscrollcommand=scrollbar.set)
        for face in registered_faces:
            self.face_listbox.insert(tk.END, f"{face['id']} - {face['name']}")
        self.face_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.config(command=self.face_listbox.yview)

        def confirm_remove():
            selected_index = self.face_listbox.curselection()
            if not selected_index:
                messagebox.showwarning("Selection Error", "Please select a face to remove.", parent=remove_window)
                return

            selected_text = self.face_listbox.get(selected_index[0])
            employee_id_to_remove = selected_text.split(' - ')[0] # Extract ID

            if messagebox.askyesno("Confirm Removal", f"Are you sure you want to remove employee with ID {employee_id_to_remove}?", parent=remove_window):
                if delete_face_data(employee_id_to_remove):
                    self.id_to_employee_info_map = train_recognizer() # Retrain the recognizer
                    messagebox.showinfo("Success", f"Face for ID {employee_id_to_remove} removed successfully!", parent=remove_window)
                    remove_window.destroy()
                else:
                    messagebox.showerror("Error", f"Failed to remove face for ID {employee_id_to_remove}.", parent=remove_window)

        tk.Button(remove_window, text="Remove Selected", command=confirm_remove).pack(pady=10)

        remove_window.protocol("WM_DELETE_WINDOW", remove_window.destroy)

    def view_faces_dialog(self):
        view_window = tk.Toplevel(self.master)
        view_window.title("Registered Faces")
        view_window.geometry("600x400") # Fixed size
        view_window.transient(self.master)
        view_window.grab_set()

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
            employee_id = face_data['id']
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
            label_img.image = img_tk # type: ignore # Keep a reference!
            label_img.pack()

            label_name = tk.Label(frame, text=f"{name} (ID: {employee_id})")
            label_name.pack()

            col += 1
            if col > 3: # 4 images per row
                col = 0
                row += 1

        view_window.update_idletasks()
        canvas.config(scrollregion=canvas.bbox("all"))
        
        view_window.protocol("WM_DELETE_WINDOW", view_window.destroy)
        

    def update_frame(self):
        if self.camera_active and self.vid.isOpened():
            ret, frame = self.vid.read()
            if ret:
                # Get current canvas dimensions
                current_canvas_width = self.canvas.winfo_width()
                current_canvas_height = self.canvas.winfo_height()

                # Resize frame to fit the current canvas dimensions
                frame = cv2.resize(frame, (current_canvas_width, current_canvas_height))
                self.current_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                # Detect faces and draw rectangles
                faces, gray_frame = detect_faces(frame)
                for (x, y, w, h) in faces:
                    cv2.rectangle(self.current_frame, (x, y), (x+w, y+h), (255, 0, 0), 2)

                self.photo = ImageTk.PhotoImage(image=Image.fromarray(self.current_frame))
                self.canvas.create_image(0, 0, image=self.photo, anchor=tk.NW)
                
                # Update video frame border color (default to black)
                self.canvas.itemconfig(self.video_frame_border, outline="black")
            else:
                # If camera is active but no frame, display a black screen
                self.canvas.create_rectangle(0, 0, self.canvas.winfo_width(), self.canvas.winfo_height(), fill="black", outline="black")
                self.status_label.config(text="Camera feed interrupted.", fg="red")
        else:
            # Display a black screen when camera is stopped
            self.canvas.create_rectangle(0, 0, self.canvas.winfo_width(), self.canvas.winfo_height(), fill="black", outline="black")
            self.status_label.config(text="Camera stopped.", fg="blue")

        self.master.after(self.delay, self.update_frame)

    def stop_camera(self):
        if self.vid.isOpened():
            self.vid.release() # Release camera resources
        self.camera_active = False
        self.btn_stop_camera.config(state=tk.DISABLED)
        self.btn_resume_camera.config(state=tk.NORMAL)
        self.status_label.config(text="Camera stopped.", fg="blue")
        self.canvas.delete("all") # Clear the canvas

    def resume_camera(self):
        self.vid = cv2.VideoCapture(self.video_source) # Re-initialize camera
        if not self.vid.isOpened():
            messagebox.showerror("Camera Error", "Unable to open video source")
            self.camera_active = False
            self.btn_stop_camera.config(state=tk.DISABLED)
            self.btn_resume_camera.config(state=tk.DISABLED)
            self.status_label.config(text="Camera error: Could not resume.", fg="red")
            return

        self.camera_active = True
        self.btn_stop_camera.config(state=tk.NORMAL)
        self.btn_resume_camera.config(state=tk.DISABLED)
        self.status_label.config(text="Camera resumed.", fg="green")

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
        self.registration_window.geometry("400x250") # Fixed size
        self.registration_window.transient(self.master) # Make it appear on top of the main window
        self.registration_window.grab_set() # Make it modal

        tk.Label(self.registration_window, text="Enter Employee ID:").pack(pady=5)
        self.employee_id_entry = tk.Entry(self.registration_window)
        self.employee_id_entry.pack(pady=5)

        tk.Label(self.registration_window, text="Enter Name:").pack(pady=5)
        self.name_entry = tk.Entry(self.registration_window)
        self.name_entry.pack(pady=5)

        tk.Button(self.registration_window, text="Capture and Register", command=self.register_face).pack(pady=10)

        self.registration_window.protocol("WM_DELETE_WINDOW", self.registration_window.destroy) # Allow closing with X button

    def register_face(self):
        employee_id = self.employee_id_entry.get().strip()
        name = self.name_entry.get().strip()

        if not employee_id or not name:
            messagebox.showwarning("Input Error", "Please enter both Employee ID and Name.", parent=self.registration_window)
            return

        if not self.camera_active or not self.vid.isOpened():
            messagebox.showerror("Camera Error", "Camera is not active. Please resume camera before registering.", parent=self.registration_window)
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
                try:
                    save_face_data(employee_id, name, face_image)
                    self.id_to_employee_info_map = train_recognizer() # Retrain the recognizer with new data
                    messagebox.showinfo("Success", f"Face for {name} (ID: {employee_id}) registered successfully!", parent=self.registration_window)
                    self.registration_window.destroy()
                except ValueError as e:
                    messagebox.showerror("Registration Error", str(e), parent=self.registration_window)
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
                employee_info, confidence = recognize_face(face_image, self.id_to_employee_info_map)
                employee_id = employee_info['id']
                name = employee_info['name']
                
                if name != "Unknown":
                    current_time = datetime.now()
                    config = load_config()
                    min_interval = config.get("min_capture_interval_minutes", 5) # Default to 5 minutes

                    if employee_id in self.last_attendance_time:
                        time_difference = (current_time - self.last_attendance_time[employee_id]).total_seconds() / 60
                        if time_difference < min_interval:
                            self.status_label.config(text=f"{name} (ID: {employee_id}) already marked attendance recently. Please wait {min_interval - int(time_difference)} minutes.", fg="orange")
                            self.canvas.itemconfig(self.video_frame_border, outline="orange")
                            continue # Skip marking attendance for this person

                    timestamp = current_time.strftime("%Y-%m-%dT%H:%M:%S.000Z")
                    attendance_record = f"{name} - {employee_id} - {timestamp}"
                    print(f"Attendance Marked: {attendance_record}")
                    self.status_label.config(text=f"Attendance Marked for: {name} (ID: {employee_id})", fg="green")
                    self.canvas.itemconfig(self.video_frame_border, outline="green")
                    # Save attendance to a log file
                    with open("attendance_log.txt", "a") as f:
                        f.write(attendance_record + "\n")
                    self.last_attendance_time[employee_id] = current_time
                else:
                    self.status_label.config(text=f"Unknown face detected.", fg="red")
                    self.canvas.itemconfig(self.video_frame_border, outline="red")
        else:
            self.status_label.config(text="No frame available. Make sure camera is working.", fg="red")

    def admin_settings_window(self):
        settings_window = tk.Toplevel(self.master)
        settings_window.title("Admin Settings")
        settings_window.geometry("400x200") # Set a fixed size for consistency

        config = load_config()
        min_interval = config.get("min_capture_interval_minutes", 5) # Default to 5 minutes

        tk.Label(settings_window, text="Minimum Capture Interval (minutes):").pack(pady=10)
        self.min_interval_entry = tk.Entry(settings_window)
        self.min_interval_entry.insert(0, str(min_interval))
        self.min_interval_entry.pack(pady=5)

        def save_admin_settings():
            try:
                new_interval = int(self.min_interval_entry.get().strip())
                if new_interval < 0:
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
        if self.vid and self.vid.isOpened():
            self.vid.release()
        self.master.destroy()

# Main execution
if __name__ == "__main__":
    root = tk.Tk()
    app = MainApplication(root)
    root.mainloop()
