import type { RegisteredFace, AppConfig } from "@/types/types";
import { initialConfig } from "./initial-config";

const REGISTERED_FACES_KEY = "registered_faces";
const CONFIG_KEY = "app_config";
const ATTENDANCE_LOG_KEY = "attendance_log";

export const loadRawFaceData = (): RegisteredFace[] => {
  const data = localStorage.getItem(REGISTERED_FACES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveRawFaceData = (data: RegisteredFace[]): void => {
  localStorage.setItem(REGISTERED_FACES_KEY, JSON.stringify(data));
};

export const loadFaceData = (): RegisteredFace[] => {
  return loadRawFaceData();
};

export const saveFaceData = (
  employeeId: string,
  name: string,
  faceDescriptor: Float32Array
): void => {
  const data = loadRawFaceData();
  if (data.some((entry) => entry.id === employeeId)) {
    throw new Error(`Employee with ID ${employeeId} already exists.`);
  }
  data.push({ id: employeeId, name, descriptor: Array.from(faceDescriptor) });
  saveRawFaceData(data);
};

export const deleteFaceData = (employeeId: string): boolean => {
  let data = loadRawFaceData();
  const initialLength = data.length;
  data = data.filter((entry) => entry.id !== employeeId);
  if (data.length < initialLength) {
    saveRawFaceData(data);
    return true;
  }
  return false;
};

export const updateFaceData = (
  employeeId: string,
  newName: string
): boolean => {
  const data = loadRawFaceData();
  let updated = false;
  for (const entry of data) {
    if (entry.id === employeeId) {
      entry.name = newName;
      updated = true;
      break;
    }
  }
  if (updated) {
    saveRawFaceData(data);
  }
  return updated;
};

async function hashPassword(password: string): Promise<string> {
  const textEncoder = new TextEncoder();
  const data = textEncoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const loadConfig = async (): Promise<AppConfig> => {
  const config = localStorage.getItem(CONFIG_KEY);
  if (config) {
    return JSON.parse(config);
  } else {
    const hashedInitialPassword = await hashPassword(
      initialConfig.admin_password
    );
    const newConfig = {
      ...initialConfig,
      admin_password: hashedInitialPassword,
    };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
    return newConfig;
  }
};

export const saveConfig = async (configData: AppConfig): Promise<void> => {
  if (
    configData.admin_password &&
    !/^[0-9a-f]{64}$/i.test(configData.admin_password)
  ) {
    configData.admin_password = await hashPassword(configData.admin_password);
  }
  localStorage.setItem(CONFIG_KEY, JSON.stringify(configData));
};

export const getAttendanceLogs = (nameOrId?: string): string[] => {
  const logs = localStorage.getItem(ATTENDANCE_LOG_KEY);
  const parsedLogs: string[] = logs ? JSON.parse(logs) : [];

  if (!nameOrId) {
    return parsedLogs;
  }

  const filterValue = nameOrId.toLowerCase();
  return parsedLogs.filter((log) => log.toLowerCase().includes(filterValue));
};

export const addAttendanceLog = (logEntry: string): void => {
  const logs = getAttendanceLogs();
  logs.push(logEntry);
  localStorage.setItem(ATTENDANCE_LOG_KEY, JSON.stringify(logs));
};

export const deleteAttendanceLog = (logToDelete: string): boolean => {
  let logs = getAttendanceLogs();
  const initialLength = logs.length;
  logs = logs.filter((log) => log !== logToDelete);
  if (logs.length < initialLength) {
    localStorage.setItem(ATTENDANCE_LOG_KEY, JSON.stringify(logs));
    return true;
  }
  return false;
};

export const editAttendanceLog = (oldLog: string, newLog: string): boolean => {
  const logs = getAttendanceLogs();
  const index = logs.indexOf(oldLog);
  if (index !== -1) {
    logs[index] = newLog;
    localStorage.setItem(ATTENDANCE_LOG_KEY, JSON.stringify(logs));
    return true;
  }
  return false;
};

export const saveAttendanceLogsToCsv = (logsData: string[]): void => {
  const headers = "employee,time\n";
  const csvContent = logsData
    .map((logEntry) => {
      const parts = logEntry.split(" - ");
      if (parts.length >= 3) {
        const name = parts[0];
        const id = parts[1];
        const timestamp = parts.slice(2).join(" - ");
        return `"${name} (ID: ${id})","${timestamp}"`;
      }
      return `"${logEntry}",""`;
    })
    .join("\n");

  const fullCsv = headers + csvContent;
  const blob = new Blob([fullCsv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "attendance_report.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportAllData = async (): Promise<void> => {
  const registeredFaces = loadRawFaceData();
  const config = await loadConfig();
  const attendanceLogs = getAttendanceLogs();

  const encryptedConfig = {
    ...config,
    admin_password: btoa(config.admin_password),
  };

  const allData = {
    registeredFaces,
    config: encryptedConfig,
    attendanceLogs,
  };

  const blob = new Blob([JSON.stringify(allData, null, 2)], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "attendance_app_backup.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const importAllData = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error("No file selected."));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);

        if (data.registeredFaces && data.config && data.attendanceLogs) {
          const decryptedConfig = {
            ...data.config,
            admin_password: atob(data.config.admin_password),
          };

          saveRawFaceData(data.registeredFaces);
          localStorage.setItem(CONFIG_KEY, JSON.stringify(decryptedConfig));
          localStorage.setItem(
            ATTENDANCE_LOG_KEY,
            JSON.stringify(data.attendanceLogs)
          );
          resolve(
            "Data restored successfully. The application will now reload."
          );
        } else {
          reject(new Error("Invalid backup file format."));
        }
      } catch (error) {
        reject(
          new Error(`Error parsing backup file: ${(error as Error).message}`)
        );
      }
    };
    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };
    reader.readAsText(file);
  });
};

export const resetAllData = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      localStorage.removeItem(REGISTERED_FACES_KEY);
      localStorage.removeItem(CONFIG_KEY);
      localStorage.removeItem(ATTENDANCE_LOG_KEY);
      resolve("All data has been reset. The application will now reload.");
    } catch (error) {
      reject(new Error(`Error resetting data: ${(error as Error).message}`));
    }
  });
};
