const REGISTERED_FACES_KEY = 'registered_faces';
const CONFIG_KEY = 'app_config';
const ATTENDANCE_LOG_KEY = 'attendance_log';

export const _loadRawFaceData = () => {
    const data = localStorage.getItem(REGISTERED_FACES_KEY);
    return data ? JSON.parse(data) : [];
};

export const _saveRawFaceData = (data) => {
    localStorage.setItem(REGISTERED_FACES_KEY, JSON.stringify(data));
};

export const loadFaceData = () => {
    return _loadRawFaceData();
};

export const saveFaceData = (employeeId, name, faceDescriptor) => {
    const data = _loadRawFaceData();
    if (data.some(entry => entry.id === employeeId)) {
        throw new Error(`Employee with ID ${employeeId} already exists.`);
    }
    data.push({ id: employeeId, name, descriptor: Array.from(faceDescriptor) });
    _saveRawFaceData(data);
};

export const deleteFaceData = (employeeId) => {
    let data = _loadRawFaceData();
    const initialLength = data.length;
    data = data.filter(entry => entry.id !== employeeId);
    if (data.length < initialLength) {
        _saveRawFaceData(data);
        return true;
    }
    return false;
};

export const updateFaceData = (employeeId, newName) => {
    const data = _loadRawFaceData();
    let updated = false;
    for (const entry of data) {
        if (entry.id === employeeId) {
            entry.name = newName;
            updated = true;
            break;
        }
    }
    if (updated) {
        _saveRawFaceData(data);
    }
    return updated;
};

import { initialConfig } from './initialConfig';

async function hashPassword(password) {
    const textEncoder = new TextEncoder();
    const data = textEncoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashedPassword;
}

export const loadConfig = async () => {
    let config = localStorage.getItem(CONFIG_KEY);
    if (config) {
        config = JSON.parse(config);
    } else {
        // If no config in localStorage, use initialConfig and hash the password
        const hashedInitialPassword = await hashPassword(initialConfig.admin_password);
        config = { ...initialConfig, admin_password: hashedInitialPassword };
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); // Save it for future use
    }
    return config;
};

export const saveConfig = async (configData) => {
    // Only hash password if it's not already hashed (e.g., if it's a new password being set)
    // A simple check: if it looks like a SHA-256 hash (64 hex chars), assume it's already hashed.
    if (configData.admin_password && !/^[0-9a-f]{64}$/i.test(configData.admin_password)) {
        configData.admin_password = await hashPassword(configData.admin_password);
    }
    localStorage.setItem(CONFIG_KEY, JSON.stringify(configData));
};

export const getAttendanceLogs = (nameOrId = null) => {
    const logs = localStorage.getItem(ATTENDANCE_LOG_KEY);
    let parsedLogs = logs ? JSON.parse(logs) : [];

    if (!nameOrId) {
        return parsedLogs;
    }

    const filterValue = nameOrId.toLowerCase();
    return parsedLogs.filter(log =>
        log.toLowerCase().includes(filterValue)
    );
};

export const addAttendanceLog = (logEntry) => {
    const logs = getAttendanceLogs();
    logs.push(logEntry);
    localStorage.setItem(ATTENDANCE_LOG_KEY, JSON.stringify(logs));
};

export const deleteAttendanceLog = (logToDelete) => {
    let logs = getAttendanceLogs();
    const initialLength = logs.length;
    logs = logs.filter(log => log !== logToDelete);
    if (logs.length < initialLength) {
        localStorage.setItem(ATTENDANCE_LOG_KEY, JSON.stringify(logs));
        return true;
    }
    return false;
};

export const editAttendanceLog = (oldLog, newLog) => {
    let logs = getAttendanceLogs();
    const index = logs.indexOf(oldLog);
    if (index !== -1) {
        logs[index] = newLog;
        localStorage.setItem(ATTENDANCE_LOG_KEY, JSON.stringify(logs));
        return true;
    }
    return false;
};

export const exportAllData = async () => {
    const registeredFaces = _loadRawFaceData();
    const config = await loadConfig();
    const attendanceLogs = getAttendanceLogs();

    // Basic encryption for the admin password
    const encryptedConfig = {
        ...config,
        admin_password: btoa(config.admin_password) 
    };

    const allData = {
        registeredFaces,
        config: encryptedConfig,
        attendanceLogs,
    };

    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'attendance_app_backup.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const importAllData = (file) => {
    return new Promise((resolve, reject) => {
        if (!file) {
            return reject(new Error("No file selected."));
        }

        if (!window.confirm("Are you sure you want to restore from this backup? This will overwrite all existing data.")) {
            return reject(new Error("Restore operation cancelled by user."));
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);

                if (data.registeredFaces && data.config && data.attendanceLogs) {
                    // Basic decryption for the admin password
                    const decryptedConfig = {
                        ...data.config,
                        admin_password: atob(data.config.admin_password)
                    };

                    _saveRawFaceData(data.registeredFaces);
                    localStorage.setItem(CONFIG_KEY, JSON.stringify(decryptedConfig));
                    localStorage.setItem(ATTENDANCE_LOG_KEY, JSON.stringify(data.attendanceLogs));
                    resolve("Data restored successfully. The application will now reload.");
                } else {
                    reject(new Error("Invalid backup file format."));
                }
            } catch (error) {
                reject(new Error(`Error parsing backup file: ${error.message}`));
            }
        };
        reader.onerror = (error) => {
            reject(new Error(`Error reading file: ${error.message}`));
        };
        reader.readAsText(file);
    });
};

export const saveAttendanceLogsToCsv = (logsData) => {
    const headers = "employee,time\n";
    const csvContent = logsData.map(logEntry => {
        const parts = logEntry.split(" - ");
        if (parts.length >= 3) {
            const name = parts[0];
            const id = parts[1];
            const timestamp = parts.slice(2).join(" - ");
            return `"${name} (ID: ${id})","${timestamp}"`;
        }
        return `"${logEntry}",""`; // Fallback for malformed logs
    }).join("\n");

    const fullCsv = headers + csvContent;
    const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // Feature detection for download attribute
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'attendance_report.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        alert("Your browser does not support downloading files directly. Please copy the content manually.");
        console.log(fullCsv);
    }
};

export const resetAllData = () => {
    return new Promise((resolve, reject) => {
        if (window.confirm("Are you sure you want to reset all data? This action cannot be undone.")) {
            try {
                localStorage.removeItem(REGISTERED_FACES_KEY);
                localStorage.removeItem(CONFIG_KEY);
                localStorage.removeItem(ATTENDANCE_LOG_KEY);
                resolve("All data has been reset. The application will now reload.");
            } catch (error) {
                reject(new Error(`Error resetting data: ${error.message}`));
            }
        } else {
            reject(new Error("Data reset cancelled by user."));
        }
    });
};