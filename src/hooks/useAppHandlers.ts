import { useState } from "react";
import type {
  RegisteredFace,
  AppConfig,
  ViewType,
  CameraStatus,
} from "@/types/types";
import {
  deleteFaceData,
  updateFaceData,
  loadConfig,
  saveConfig,
  getAttendanceLogs,
  deleteAttendanceLog,
  editAttendanceLog,
  saveAttendanceLogsToCsv,
  exportAllData,
  importAllData,
  resetAllData,
} from "@/utils/data-manager";
import { hashPassword } from "@/utils/authUtils";

interface UseAppHandlersProps {
  updateStatus: (
    message: string,
    borderColor?: CameraStatus["borderColor"]
  ) => void;
  loadRegisteredFaces: () => void;
  setRegisteredFaces: React.Dispatch<React.SetStateAction<RegisteredFace[]>>;
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveView: React.Dispatch<React.SetStateAction<ViewType>>;
}

export const useAppHandlers = ({
  updateStatus,
  loadRegisteredFaces,
  config,
  setConfig,
  setLoading,
  setActiveView,
}: UseAppHandlersProps) => {
  // Core states
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);

  // Form states
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedFaceId, setSelectedFaceId] = useState("");
  const [newFaceName, setNewFaceName] = useState("");
  const [reportFilter, setReportFilter] = useState("");
  const [filteredLogs, setFilteredLogs] = useState<string[]>([]);
  const [selectedLog, setSelectedLog] = useState("");
  const [newLogEntry, setNewLogEntry] = useState("");
  const [oldAdminPassword, setOldAdminPassword] = useState("");
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");

  const handleAdminLogin = async () => {
    if (!adminUsername || !adminPassword) {
      updateStatus("Please enter both username and password.", "warning");
      return;
    }

    setLoading(true);
    try {
      const currentConfig = await loadConfig();
      const hashedPassword = await hashPassword(adminPassword);
      console.log(currentConfig.admin_password, hashedPassword);

      if (
        adminUsername === currentConfig.admin_username &&
        hashedPassword === currentConfig.admin_password
      ) {
        setAdminLoggedIn(true);
        updateStatus("Admin logged in successfully!", "success");
        setActiveView("attendance");
      } else {
        updateStatus(
          "Invalid admin credentials. Please try again.",
          "destructive"
        );
      }
    } catch (error) {
      updateStatus("Error during login. Please try again.", "destructive");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogout = () => {
    setAdminLoggedIn(false);
    setAdminUsername("");
    setAdminPassword("");
    updateStatus("Admin logged out.", "default");
    setActiveView("attendance");
  };

  const handleManageFaces = async (action: "delete" | "update") => {
    if (!selectedFaceId) {
      updateStatus("Please select an employee ID.", "warning");
      return;
    }

    try {
      if (action === "delete") {
        if (deleteFaceData(selectedFaceId)) {
          loadRegisteredFaces();
          updateStatus(
            `Face data for ID ${selectedFaceId} deleted.`,
            "success"
          );
          setSelectedFaceId("");
        }
      } else if (action === "update") {
        if (!newFaceName) {
          updateStatus("Please enter a new name.", "warning");
          return;
        }
        if (updateFaceData(selectedFaceId, newFaceName)) {
          loadRegisteredFaces();
          updateStatus(
            `Name for ID ${selectedFaceId} updated to ${newFaceName}.`,
            "success"
          );
          setSelectedFaceId("");
          setNewFaceName("");
        }
      }
    } catch (error) {
      updateStatus(
        `Error managing face: ${(error as Error).message}`,
        "destructive"
      );
    }
  };

  const handleViewReports = () => {
    const logs = getAttendanceLogs(reportFilter);
    setFilteredLogs(logs);
  };

  const handleEditLog = () => {
    if (!selectedLog || !newLogEntry) {
      updateStatus(
        "Please select a log and enter a new entry to edit.",
        "warning"
      );
      return;
    }

    if (editAttendanceLog(selectedLog, newLogEntry)) {
      updateStatus("Log entry updated successfully!", "success");
      handleViewReports();
      setSelectedLog("");
      setNewLogEntry("");
    } else {
      updateStatus("Failed to update log entry.", "destructive");
    }
  };

  const handleDeleteLog = () => {
    if (!selectedLog) {
      updateStatus("Please select a log to delete.", "warning");
      return;
    }

    if (deleteAttendanceLog(selectedLog)) {
      updateStatus("Log entry deleted successfully!", "success");
      handleViewReports();
      setSelectedLog("");
    } else {
      updateStatus("Failed to delete log entry.", "destructive");
    }
  };

  const handleSaveReportsAsCsv = () => {
    if (filteredLogs.length === 0) {
      updateStatus("No logs to export.", "warning");
      return;
    }
    saveAttendanceLogsToCsv(filteredLogs);
    updateStatus(
      "Attendance report downloaded as CSV successfully.",
      "success"
    );
  };

  const handleSaveAdminSettings = async () => {
    try {
      const currentConfig = await loadConfig();

      const newMinInterval = Number.parseInt(
        config.min_capture_interval_minutes.toString()
      );
      if (isNaN(newMinInterval) || newMinInterval < 0) {
        updateStatus(
          "Minimum capture interval must be a non-negative number.",
          "warning"
        );
        return;
      }
      console.log("New min interval:", newMinInterval);

      const updatedConfig = {
        ...currentConfig,
        min_capture_interval_minutes: newMinInterval,
      };

      await saveConfig(updatedConfig);
      setConfig(updatedConfig);
      updateStatus("Admin credentials updated successfully!", "success");
    } catch (error) {
      updateStatus("Error updating credentials.", "destructive");
    } finally {
      setLoading(false);
    }
    try {
      console.log("New min interval:", config);
      const newMinInterval = Number.parseInt(
        config.min_capture_interval_minutes.toString()
      );
      if (isNaN(newMinInterval) || newMinInterval < 0) {
        updateStatus(
          "Minimum capture interval must be a non-negative number.",
          "warning"
        );
        return;
      }
      await saveConfig(config);
      updateStatus("Admin settings saved successfully!", "success");
    } catch (error) {
      updateStatus(
        `Error saving settings: ${(error as Error).message}`,
        "destructive"
      );
    }
  };

  const handleChangeAdminCredentials = async () => {
    if (!oldAdminPassword) {
      updateStatus("Please enter your old password.", "warning");
      return;
    }

    setLoading(true);
    try {
      const currentConfig = await loadConfig();
      const hashedOldPassword = await hashPassword(oldAdminPassword);

      if (hashedOldPassword !== currentConfig.admin_password) {
        updateStatus("Incorrect old password.", "destructive");
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
      setConfig(updatedConfig);
      setOldAdminPassword("");
      setNewAdminUsername("");
      setNewAdminPassword("");
      updateStatus("Admin credentials updated successfully!", "success");
    } catch (error) {
      updateStatus("Error updating credentials.", "destructive");
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      await exportAllData();
      updateStatus("All data exported successfully!", "success");
    } catch (error) {
      updateStatus(
        `Error exporting data: ${(error as Error).message}`,
        "destructive"
      );
    }
  };

  const handleImportData = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const message = await importAllData(file);
      updateStatus(message, "success");
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      updateStatus(
        `Error importing data: ${(error as Error).message}`,
        "destructive"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset all data? This action cannot be undone."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const message = await resetAllData();
      updateStatus(message, "success");
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      updateStatus(
        `Error resetting data: ${(error as Error).message}`,
        "destructive"
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    adminLoggedIn,
    setAdminLoggedIn,
    adminUsername,
    setAdminUsername,
    adminPassword,
    setAdminPassword,
    showPassword,
    setShowPassword,
    selectedFaceId,
    setSelectedFaceId,
    newFaceName,
    setNewFaceName,
    reportFilter,
    setReportFilter,
    filteredLogs,
    setFilteredLogs,
    selectedLog,
    setSelectedLog,
    newLogEntry,
    setNewLogEntry,
    oldAdminPassword,
    setOldAdminPassword,
    newAdminUsername,
    setNewAdminUsername,
    newAdminPassword,
    setNewAdminPassword,
    handleAdminLogin,
    handleAdminLogout,
    handleManageFaces,
    handleViewReports,
    handleEditLog,
    handleDeleteLog,
    handleSaveReportsAsCsv,
    handleSaveAdminSettings,
    handleChangeAdminCredentials,
    handleExportData,
    handleImportData,
    handleResetData,
  };
};
