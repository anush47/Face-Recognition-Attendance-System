import React, { useState, useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import {
  loadFaceData,
  saveFaceData,
  deleteFaceData,
  updateFaceData,
  loadConfig,
  saveConfig,
  getAttendanceLogs,
  addAttendanceLog,
  deleteAttendanceLog,
  editAttendanceLog,
  saveAttendanceLogsToCsv,
} from "./dataManager";
import "./App.css";

const MODEL_URL = "/"; // Models are in the public folder

function App() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Loading models...");
  const [registeredFaces, setRegisteredFaces] = useState([]);
  const [internalLabeledFaceDescriptors, setInternalLabeledFaceDescriptors] =
    useState(null);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState("attendance"); // 'attendance', 'register', 'manage', 'reports', 'settings'
  const [lastAttendanceTime, setLastAttendanceTime] = useState({});
  const [config, setConfig] = useState({}); // Initialize as empty object, will be loaded asynchronously

  // State for registration form
  const [regEmployeeId, setRegEmployeeId] = useState("");
  const [regName, setRegName] = useState("");

  // State for admin login
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // State for manage faces
  const [selectedFaceId, setSelectedFaceId] = useState("");
  const [newFaceName, setNewFaceName] = useState("");

  // State for reports
  const [reportFilter, setReportFilter] = useState("");
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState("");
  const [newLogEntry, setNewLogEntry] = useState("");

  // State for admin credential change
  const [oldAdminPassword, setOldAdminPassword] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load models
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL); // For better face detection
        setModelsLoaded(true);
        setStatusMessage("Models loaded. Loading configuration...");

        // Load configuration
        const loadedConfig = await loadConfig();
        setConfig(loadedConfig);
        setStatusMessage("Configuration loaded. Starting camera...");

        // Start camera and load registered faces
        startCamera();
        loadRegisteredFaces();
      } catch (error) {
        console.error("Error initializing app:", error);
        setStatusMessage("Error initializing app. Please check console.");
      }
    };
    initializeApp();
  }, []);

  useEffect(() => {
    if (registeredFaces.length > 0) {
      const labeledDescriptors = registeredFaces.map(
        (face) =>
          new faceapi.LabeledFaceDescriptors(face.id, [
            new Float32Array(face.descriptor),
          ])
      );
      setInternalLabeledFaceDescriptors(labeledDescriptors);
    } else {
      setInternalLabeledFaceDescriptors(null);
    }
  }, [registeredFaces]);

  const loadRegisteredFaces = () => {
    try {
      const faces = loadFaceData();
      setRegisteredFaces(faces);
      setStatusMessage(`Loaded ${faces.length} registered faces.`);
    } catch (error) {
      console.error("Error loading registered faces:", error);
      setStatusMessage("Error loading registered faces.");
    }
  };

  const startCamera = async () => {
    if (cameraActive) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setCameraActive(true);
      setStatusMessage("Camera active. Ready for attendance.");
    } catch (error) {
      console.error("Error accessing camera:", error);
      setStatusMessage(
        "Error accessing camera. Please ensure camera is connected and permissions are granted."
      );
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setStatusMessage("Camera stopped.");
  };

  const handleVideoPlay = () => {
    if (!canvasRef.current || !videoRef.current) return;

    // Ensure video dimensions are available before proceeding
    if (
      videoRef.current.videoWidth === 0 ||
      videoRef.current.videoHeight === 0
    ) {
      console.log("Video dimensions not yet available. Retrying...");
      setTimeout(handleVideoPlay, 100); // Retry after a short delay
      return;
    }

    const displaySize = {
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight,
    };
    faceapi.matchDimensions(canvasRef.current, displaySize);

    setInterval(async () => {
      if (
        !videoRef.current ||
        videoRef.current.paused ||
        videoRef.current.ended ||
        !modelsLoaded
      ) {
        return;
      }

      // Re-check dimensions inside interval as well, though less likely to be 0 after initial check
      if (
        videoRef.current.videoWidth === 0 ||
        videoRef.current.videoHeight === 0
      ) {
        return; // Skip this frame if dimensions are somehow lost
      }

      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptors();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const context = canvasRef.current.getContext("2d");
      context.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);

      if (internalLabeledFaceDescriptors) {
        const faceMatcher = new faceapi.FaceMatcher(
          internalLabeledFaceDescriptors,
          0.6
        ); // 0.6 is a good threshold
        resizedDetections.forEach((detection) => {
          const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
          const box = detection.detection.box;
          const drawBox = new faceapi.draw.DrawBox(box, {
            label: bestMatch.toString(),
          });
          drawBox.draw(canvasRef.current);
        });
      }
    }, 100); // Run detection every 100ms
  };

  const handleAdminLogin = async () => {
    const currentConfig = await loadConfig();
    const hashedPassword = await hashPassword(adminPassword);

    if (
      adminUsername === currentConfig.admin_username &&
      hashedPassword === currentConfig.admin_password
    ) {
      setAdminLoggedIn(true);
      setStatusMessage("Admin logged in successfully!");
      setActiveView("attendance"); // Go back to attendance view after login
    } else {
      setStatusMessage("Invalid admin credentials. Please try again.");
    }
  };

  const handleAdminLogout = () => {
    setAdminLoggedIn(false);
    setAdminUsername("");
    setAdminPassword("");
    setStatusMessage("Admin logged out.");
    setActiveView("attendance");
  };

  const handleRegisterFace = async () => {
    console.log("Attempting to register face...");
    if (!regEmployeeId || !regName) {
      setStatusMessage("Please enter both Employee ID and Name.");
      console.log("Validation failed: Employee ID or Name missing.");
      return;
    }
    if (
      !videoRef.current ||
      videoRef.current.paused ||
      videoRef.current.ended
    ) {
      setStatusMessage("Camera not active. Please start camera.");
      console.log("Validation failed: Camera not active.");
      return;
    }

    console.log("Detecting single face...");
    const detections = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detections) {
      console.log("Face detected:", detections);
      try {
        saveFaceData(regEmployeeId, regName, detections.descriptor);
        loadRegisteredFaces(); // Reload faces to update matcher
        setStatusMessage(
          `Face for ${regName} (ID: ${regEmployeeId}) registered successfully!`
        );
        setRegEmployeeId("");
        setRegName("");
        setActiveView("attendance"); // Go back to attendance view
        console.log("Face registered successfully.");
      } catch (error) {
        setStatusMessage(`Registration Error: ${error.message}`);
        console.error("Registration Error during saveFaceData:", error);
      }
    } else {
      setStatusMessage(
        "No face detected. Please ensure your face is clearly visible."
      );
      console.log("No face detected by face-api.js.");
    }
  };

  const [cameraBorderColor, setCameraBorderColor] = useState("black"); // State for camera border color

  const handleMarkAttendance = async () => {
    if (
      !videoRef.current ||
      videoRef.current.paused ||
      videoRef.current.ended
    ) {
      setStatusMessage("Camera not active. Please start camera.");
      setCameraBorderColor("red");
      return;
    }
    if (
      !internalLabeledFaceDescriptors ||
      internalLabeledFaceDescriptors.length === 0
    ) {
      setStatusMessage("No faces registered. Please register faces first.");
      setCameraBorderColor("orange");
      return;
    }

    const detections = await faceapi
      .detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options())
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length === 0) {
      setStatusMessage("No face detected for attendance.");
      setCameraBorderColor("red");
      return;
    }

    const faceMatcher = new faceapi.FaceMatcher(
      internalLabeledFaceDescriptors,
      0.6
    );
    let markedCount = 0;
    let unknownCount = 0;
    let timeoutCount = 0;

    for (const detection of detections) {
      const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
      if (bestMatch.label !== "unknown") {
        const employeeId = bestMatch.label;
        const employeeName =
          registeredFaces.find((f) => f.id === employeeId)?.name || "Unknown";
        const currentTime = new Date();
        const minInterval = config.min_capture_interval_minutes;

        if (lastAttendanceTime[employeeId]) {
          const timeDifference =
            (currentTime.getTime() - lastAttendanceTime[employeeId].getTime()) /
            (1000 * 60); // in minutes
          if (timeDifference < minInterval) {
            setStatusMessage(
              `${employeeName} (ID: ${employeeId}) already marked attendance recently. Please wait ${Math.ceil(
                minInterval - timeDifference
              )} minutes.`
            );
            setCameraBorderColor("orange");
            timeoutCount++;
            continue;
          }
        }

        const timestamp = currentTime.toISOString();
        const attendanceRecord = `${employeeName} - ${employeeId} - ${timestamp}`;
        addAttendanceLog(attendanceRecord);
        setLastAttendanceTime((prev) => ({
          ...prev,
          [employeeId]: currentTime,
        }));
        setStatusMessage(
          `Attendance Marked for: ${employeeName} (ID: ${employeeId})`
        );
        setCameraBorderColor("green");
        markedCount++;
      } else {
        setStatusMessage("Unknown face detected.");
        setCameraBorderColor("red");
        unknownCount++;
      }
    }
    if (
      markedCount === 0 &&
      unknownCount === 0 &&
      timeoutCount === 0 &&
      detections.length > 0
    ) {
      setStatusMessage("No registered faces detected for attendance.");
      setCameraBorderColor("red");
    } else if (markedCount > 0) {
      setCameraBorderColor("green");
    } else if (unknownCount > 0) {
      setCameraBorderColor("red");
    } else if (timeoutCount > 0) {
      setCameraBorderColor("orange");
    }
  };

  const handleManageFaces = (action) => {
    if (!selectedFaceId) {
      setStatusMessage("Please select an employee ID.");
      return;
    }
    try {
      if (action === "delete") {
        if (
          window.confirm(
            `Are you sure you want to delete face data for ID: ${selectedFaceId}?`
          )
        ) {
          deleteFaceData(selectedFaceId);
          loadRegisteredFaces();
          setStatusMessage(`Face data for ID ${selectedFaceId} deleted.`);
          setSelectedFaceId("");
        }
      } else if (action === "update") {
        if (!newFaceName) {
          setStatusMessage("Please enter a new name.");
          return;
        }
        updateFaceData(selectedFaceId, newFaceName);
        loadRegisteredFaces();
        setStatusMessage(
          `Name for ID ${selectedFaceId} updated to ${newFaceName}.`
        );
        setSelectedFaceId("");
        setNewFaceName("");
      }
    } catch (error) {
      setStatusMessage(`Error managing face: ${error.message}`);
    }
  };

  const handleViewReports = () => {
    const logs = getAttendanceLogs(reportFilter);
    setFilteredLogs(logs);
  };

  const handleEditLog = () => {
    if (!selectedLog || !newLogEntry) {
      setStatusMessage("Please select a log and enter a new entry to edit.");
      setCameraBorderColor("orange");
      return;
    }
    if (
      window.confirm(`Are you sure you want to edit this log entry?
Old: ${selectedLog}
New: ${newLogEntry}`)
    ) {
      if (editAttendanceLog(selectedLog, newLogEntry)) {
        setStatusMessage("Log entry updated successfully!");
        handleViewReports(); // Refresh reports
        setSelectedLog("");
        setNewLogEntry("");
        setCameraBorderColor("green");
      } else {
        setStatusMessage(
          "Failed to update log entry. Log not found or an error occurred."
        );
        setCameraBorderColor("red");
      }
    }
  };

  const handleDeleteLog = () => {
    if (!selectedLog) {
      setStatusMessage("Please select a log to delete.");
      setCameraBorderColor("orange");
      return;
    }
    if (
      window.confirm(`Are you sure you want to delete this log entry?
${selectedLog}`)
    ) {
      if (deleteAttendanceLog(selectedLog)) {
        setStatusMessage("Log entry deleted successfully!");
        handleViewReports(); // Refresh reports
        setSelectedLog("");
        setCameraBorderColor("green");
      } else {
        setStatusMessage(
          "Failed to delete log entry. Log not found or an error occurred."
        );
        setCameraBorderColor("red");
      }
    }
  };

  const handleSaveReportsAsCsv = () => {
    if (filteredLogs.length === 0) {
      setStatusMessage("No logs to export. Filtered logs list is empty.");
      setCameraBorderColor("orange");
      return;
    }
    saveAttendanceLogsToCsv(filteredLogs);
    setStatusMessage("Attendance report downloaded as CSV successfully.");
    setCameraBorderColor("green");
  };

  const handleSaveAdminSettings = async () => {
    try {
      const newMinInterval = parseInt(config.min_capture_interval_minutes);
      if (isNaN(newMinInterval) || newMinInterval < 0) {
        setStatusMessage(
          "Minimum capture interval must be a non-negative number."
        );
        setCameraBorderColor("orange");
        return;
      }
      await saveConfig(config);
      setStatusMessage("Admin settings saved successfully!");
      setCameraBorderColor("green");
    } catch (error) {
      setStatusMessage(`Error saving settings: ${error.message}`);
      setCameraBorderColor("red");
    }
  };

  async function hashPassword(password) {
    const textEncoder = new TextEncoder();
    const data = textEncoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashedPassword;
  }

  const handleChangeAdminCredentials = async () => {
    const currentConfig = await loadConfig();
    const hashedOldPassword = await hashPassword(oldAdminPassword);

    if (hashedOldPassword !== currentConfig.admin_password) {
      setStatusMessage('Incorrect old password. Admin credentials not updated.');
      setCameraBorderColor('red');
      return;
    }

    const updatedConfig = { ...currentConfig };
    if (newAdminUsername) {
      updatedConfig.admin_username = newAdminUsername;
    }
    if (newAdminPassword) {
      updatedConfig.admin_password = await hashPassword(newAdminPassword);
    }

    await saveConfig(updatedConfig);
    setConfig(updatedConfig); // Update local state
    setOldAdminPassword('');
    setNewAdminUsername('');
    setNewAdminPassword('');
    setStatusMessage('Admin credentials updated successfully!');
    setCameraBorderColor('green');
  };

  const renderContent = () => {
    switch (activeView) {
      case "attendance":
        return (
          <div className="attendance-view">
            <h2>Attendance Marking</h2>
            <button
              onClick={handleMarkAttendance}
              disabled={!cameraActive || !modelsLoaded}
            >
              Mark Attendance
            </button>
            <div className="camera-controls">
              <button onClick={stopCamera} disabled={!cameraActive}>
                Stop Camera
              </button>
              <button onClick={startCamera} disabled={cameraActive}>
                Start Camera
              </button>
            </div>
          </div>
        );
      case "register":
        return (
          <div className="register-view">
            <h2>Register New Face</h2>
            <input
              type="text"
              placeholder="Employee ID"
              value={regEmployeeId}
              onChange={(e) => setRegEmployeeId(e.target.value)}
            />
            <input
              type="text"
              placeholder="Employee Name"
              value={regName}
              onChange={(e) => setNewRegName(e.target.value)}
            />
            <button
              onClick={handleRegisterFace}
              disabled={!cameraActive || !modelsLoaded}
            >
              Capture and Register
            </button>
          </div>
        );
      case "manage":
        return (
          <div className="manage-view">
            <h2>Manage Registered Faces</h2>
            <select
              value={selectedFaceId}
              onChange={(e) => setSelectedFaceId(e.target.value)}
            >
              <option value="">Select Employee ID</option>
              {registeredFaces.map((face) => (
                <option key={face.id} value={face.id}>
                  {face.id} - {face.name}
                </option>
              ))}
            </select>
            <div className="manage-actions">
              <button onClick={() => handleManageFaces("delete")}>
                Delete Selected
              </button>
              <input
                type="text"
                placeholder="New Name (for update)"
                value={newFaceName}
                onChange={(e) => setNewFaceName(e.target.value)}
              />
              <button onClick={() => handleManageFaces("update")}>
                Update Name
              </button>
            </div>
            <h3>Registered Faces:</h3>
            <ul>
              {registeredFaces.map((face) => (
                <li key={face.id}>
                  {face.id} - {face.name}
                </li>
              ))}
            </ul>
          </div>
        );
      case "reports":
        return (
          <div className="reports-view">
            <h2>Attendance Reports</h2>
            <input
              type="text"
              placeholder="Filter by Name/ID"
              value={reportFilter}
              onChange={(e) => setReportFilter(e.target.value)}
            />
            <button onClick={handleViewReports}>Apply Filter</button>
            <button onClick={handleSaveReportsAsCsv}>Save as CSV</button>
            <div className="log-list">
              <h3>Logs:</h3>
              <select
                size="10"
                value={selectedLog}
                onChange={(e) => setSelectedLog(e.target.value)}
              >
                {filteredLogs.map((log, index) => (
                  <option key={index} value={log}>
                    {log}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Edit Log Entry"
                value={newLogEntry}
                onChange={(e) => setNewLogEntry(e.target.value)}
              />
              <button onClick={handleEditLog}>Edit Selected Log</button>
              <button onClick={handleDeleteLog}>Delete Selected Log</button>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="settings-view">
            <h2>Admin Settings</h2>
            <label>
              Minimum Capture Interval (minutes):
              <input
                type="number"
                value={config.min_capture_interval_minutes}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    min_capture_interval_minutes: e.target.value,
                  })
                }
              />
            </label>
            <button onClick={handleSaveAdminSettings}>Save Settings</button>

            <h3>Change Admin Credentials</h3>
            <input
              type="password"
              placeholder="Old Password"
              value={oldAdminPassword}
              onChange={(e) => setOldAdminPassword(e.target.value)}
            />
            <input
              type="text"
              placeholder="New Username (optional)"
              value={newAdminUsername}
              onChange={(e) => setNewAdminUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="New Password (optional)"
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
            />
            <button onClick={handleChangeAdminCredentials}>Update Credentials</button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="App-container">
      <header className="App-header">
        <h1>Face Attendance System</h1>
        <p
          className="status-message"
          style={{
            color:
              statusMessage.includes("Error") ||
              statusMessage.includes("Failed") ||
              statusMessage.includes("Invalid")
                ? "red"
                : statusMessage.includes("successfully")
                ? "green"
                : "black",
          }}
        >
          {statusMessage}
        </p>
      </header>

      <div className="App-main">
        <aside className="App-sidebar">
          {!adminLoggedIn ? (
            <div className="admin-login">
              <h2>Admin Login</h2>
              <input
                type="text"
                placeholder="Username"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
              <button onClick={handleAdminLogin}>Login</button>
            </div>
          ) : (
            <div className="admin-panel">
              <button onClick={() => setActiveView("attendance")}>
                Attendance
              </button>
              <button onClick={() => setActiveView("register")}>
                Register Face
              </button>
              <button onClick={() => setActiveView("manage")}>
                Manage Faces
              </button>
              <button onClick={() => setActiveView("reports")}>Reports</button>
              <button onClick={() => setActiveView("settings")}>
                Settings
              </button>
              <button onClick={handleAdminLogout}>Logout</button>
            </div>
          )}
        </aside>

        <main className="App-content">
          <div className="camera-section">
            <h2>Live Camera Feed</h2>
            <div
              className="camera-feed-container"
              style={{ borderColor: cameraBorderColor }}
            >
              <video
                ref={videoRef}
                onPlay={handleVideoPlay}
                width="640"
                height="480"
                muted
              ></video>
              <canvas ref={canvasRef} className="overlay-canvas"></canvas>
            </div>
          </div>

          <div className="feature-section">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}

export default App;
