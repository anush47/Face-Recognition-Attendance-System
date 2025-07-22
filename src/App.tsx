import { useState, useEffect } from "react";
import * as faceapi from "face-api.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera,
  CameraOff,
  UserPlus,
  Users,
  FileText,
  Settings,
  Download,
  Upload,
  Trash2,
  Edit,
  Save,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import type { AppConfig, ViewType } from "@/types/types";
import AdminPanel from "./components/AdminPanel";
import Header from "./components/Header";
import { useFaceRecognition } from "./hooks/useFaceRecognition";
import { useAppHandlers } from "./hooks/useAppHandlers";

export default function FaceAttendanceApp() {
  const [activeView, setActiveView] = useState<ViewType>("attendance");
  const [lastAttendanceTime, setLastAttendanceTime] = useState<
    Record<string, Date>
  >({});
  const [config, setConfig] = useState<AppConfig>({} as AppConfig);
  const [_loading, setLoading] = useState(false);

  // Form states
  const [regEmployeeId, setRegEmployeeId] = useState("");
  const [regName, setRegName] = useState("");

  const {
    videoRef,
    canvasRef,
    modelsLoaded,
    cameraStatus,
    loading,
    registeredFaces,
    statusMessage,
    loadRegisteredFaces,
    updateStatus,
    setRegisteredFaces,
    setInternalLabeledFaceDescriptors,
    initializeApp,
    startCamera,
    stopCamera,
    handleVideoPlay,
    handleRegisterFace,
    handleMarkAttendance,
  } = useFaceRecognition({
    config,
    lastAttendanceTime,
    setLastAttendanceTime,
  });

  const {
    adminLoggedIn,
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
  } = useAppHandlers({
    updateStatus,
    loadRegisteredFaces,
    setRegisteredFaces,
    config,
    setConfig,
    setLoading,
    setActiveView,
  });

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

  useEffect(() => {
    initializeApp();
  }, []);

  const getBorderColorClass = () => {
    switch (cameraStatus.borderColor) {
      case "success":
        return "border-green-400 shadow-green-200 shadow-lg";
      case "warning":
        return "border-yellow-400 shadow-yellow-200 shadow-lg";
      case "destructive":
        return "border-red-400 shadow-red-200 shadow-lg";
      default:
        return "border-slate-300 shadow-slate-200 shadow-lg";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <Header
            statusMessage={statusMessage}
            cameraBorderColor={cameraStatus.borderColor}
          />
        </div>

        {/* Mobile-First Responsive Layout */}
        <div className="space-y-6">
          <AdminPanel
            adminLoggedIn={adminLoggedIn}
            adminUsername={adminUsername}
            setAdminUsername={setAdminUsername}
            adminPassword={adminPassword}
            setAdminPassword={setAdminPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            loading={loading}
            handleAdminLogin={handleAdminLogin}
            handleAdminLogout={handleAdminLogout}
            activeView={activeView}
            setActiveView={setActiveView}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Camera Section - Enhanced */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-100 to-purple-100">
                      <Camera className="h-5 w-5 text-indigo-600" />
                    </div>
                    <span className="text-xl font-semibold text-slate-800">
                      Live Camera Feed
                    </span>
                  </div>
                  <Badge
                    variant={cameraStatus.active ? "default" : "secondary"}
                    className={`${
                      cameraStatus.active
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {cameraStatus.active ? "Active" : "Inactive"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div
                    className={`relative rounded-2xl border-4 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 shadow-inner ${getBorderColorClass()}`}
                  >
                    <video
                      ref={videoRef}
                      onPlay={handleVideoPlay}
                      className="w-full h-auto max-h-[400px] object-cover rounded-xl"
                      muted
                      playsInline
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 w-full h-full rounded-xl"
                    />
                    {!cameraStatus.active && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-xl">
                        <div className="text-center text-white">
                          <div className="p-4 rounded-full bg-white/10 backdrop-blur-sm mb-4 inline-block">
                            <CameraOff className="h-12 w-12" />
                          </div>
                          <p className="text-lg font-medium">
                            Camera is not active
                          </p>
                          <p className="text-sm text-slate-300 mt-1">
                            Click "Start Camera" to begin
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      onClick={startCamera}
                      disabled={cameraStatus.active || loading}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      {loading ? "Starting..." : "Start Camera"}
                    </Button>
                    <Button
                      onClick={stopCamera}
                      disabled={!cameraStatus.active}
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 font-medium py-3 bg-transparent"
                    >
                      <CameraOff className="mr-2 h-4 w-4" />
                      Stop Camera
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature Content - Enhanced */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardContent className="p-6">
                {activeView === "attendance" && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="p-3 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 inline-block mb-4">
                        <CheckCircle className="h-8 w-8 text-indigo-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-slate-800 mb-2">
                        Mark Attendance
                      </h2>
                      <p className="text-slate-600 mb-6">
                        Position your face in front of the camera
                      </p>
                      <Button
                        onClick={handleMarkAttendance}
                        disabled={
                          !cameraStatus.active || !modelsLoaded || loading
                        }
                        size="lg"
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-4 text-lg shadow-lg"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-3 h-5 w-5" />
                            Mark Attendance
                          </>
                        )}
                      </Button>
                    </div>
                    {registeredFaces.length > 0 && (
                      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6">
                        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <Users className="h-5 w-5 text-indigo-600" />
                          Registered Employees ({registeredFaces.length})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {registeredFaces.map((face) => (
                            <div
                              key={face.id}
                              className="bg-white rounded-lg p-3 shadow-sm border border-slate-100"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                  {face.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800">
                                    {face.name}
                                  </p>
                                  <p className="text-sm text-slate-500">
                                    ID: {face.id}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeView === "register" && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="p-3 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 inline-block mb-4">
                        <UserPlus className="h-8 w-8 text-green-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-slate-800 mb-2">
                        Register New Face
                      </h2>
                      <p className="text-slate-600">
                        Add a new employee to the system
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label
                            htmlFor="employeeId"
                            className="text-sm font-semibold text-slate-700"
                          >
                            Employee ID
                          </Label>
                          <Input
                            id="employeeId"
                            placeholder="Enter Employee ID"
                            value={regEmployeeId}
                            onChange={(e) => setRegEmployeeId(e.target.value)}
                            className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="employeeName"
                            className="text-sm font-semibold text-slate-700"
                          >
                            Employee Name
                          </Label>
                          <Input
                            id="employeeName"
                            placeholder="Enter Employee Name"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={() =>
                          handleRegisterFace(regEmployeeId, regName)
                        }
                        disabled={
                          !cameraStatus.active || !modelsLoaded || loading
                        }
                        className="w-full mt-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Registering...
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Capture and Register
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {activeView === "manage" && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="p-3 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 inline-block mb-4">
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-slate-800 mb-2">
                        Manage Registered Faces
                      </h2>
                      <p className="text-slate-600">
                        Update or remove employee records
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 space-y-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="selectEmployee"
                          className="text-sm font-semibold text-slate-700"
                        >
                          Select Employee
                        </Label>
                        <Select
                          value={selectedFaceId}
                          onValueChange={setSelectedFaceId}
                        >
                          <SelectTrigger className="border-slate-200 focus:border-indigo-500">
                            <SelectValue placeholder="Select Employee ID" />
                          </SelectTrigger>
                          <SelectContent>
                            {registeredFaces.map((face) => (
                              <SelectItem key={face.id} value={face.id}>
                                {face.id} - {face.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Button
                          onClick={() => handleManageFaces("delete")}
                          disabled={!selectedFaceId}
                          variant="destructive"
                          className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 py-3 text-white"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Selected
                        </Button>
                        <div className="space-y-3">
                          <Input
                            placeholder="New Name (for update)"
                            value={newFaceName}
                            onChange={(e) => setNewFaceName(e.target.value)}
                            className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                          />
                          <Button
                            onClick={() => handleManageFaces("update")}
                            disabled={!selectedFaceId || !newFaceName}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-3 text-white"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Update Name
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                      <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-indigo-600" />
                        All Registered Faces
                      </h3>
                      <ScrollArea className="h-64">
                        {registeredFaces.length === 0 ? (
                          <div className="text-center py-12">
                            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">
                              No faces registered yet.
                            </p>
                            <p className="text-sm text-slate-400">
                              Register your first employee to get started.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {registeredFaces.map((face) => (
                              <div
                                key={face.id}
                                className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-slate-100"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                    {face.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-800">
                                      {face.name}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                      ID: {face.id}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </div>
                )}

                {activeView === "reports" && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="p-3 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 inline-block mb-4">
                        <FileText className="h-8 w-8 text-purple-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-slate-800 mb-2">
                        Attendance Reports
                      </h2>
                      <p className="text-slate-600">
                        View and manage attendance records
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Input
                          placeholder="Filter by Name/ID"
                          value={reportFilter}
                          onChange={(e) => setReportFilter(e.target.value)}
                          className="flex-1 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <Button
                          onClick={handleViewReports}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                        >
                          Apply Filter
                        </Button>
                        <Button
                          onClick={handleSaveReportsAsCsv}
                          variant="outline"
                          className="border-green-200 text-green-700 hover:bg-green-50 bg-transparent"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Export CSV
                        </Button>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                      <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-600" />
                        Attendance Logs
                      </h3>
                      <ScrollArea className="h-80 mb-4">
                        {filteredLogs.length === 0 ? (
                          <div className="text-center py-12">
                            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">
                              No logs found.
                            </p>
                            <p className="text-sm text-slate-400">
                              Attendance records will appear here.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {filteredLogs.map((log, index) => (
                              <div
                                key={index}
                                className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                                  selectedLog === log
                                    ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 shadow-sm"
                                    : "bg-slate-50 hover:bg-slate-100 border border-slate-200"
                                }`}
                                onClick={() => setSelectedLog(log)}
                              >
                                <p className="text-sm font-medium text-slate-700">
                                  {log}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>

                      {selectedLog && (
                        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 space-y-4">
                          <Label
                            htmlFor="editLog"
                            className="text-sm font-semibold text-slate-700"
                          >
                            Edit Selected Log
                          </Label>
                          <Textarea
                            id="editLog"
                            placeholder="Edit log entry"
                            value={newLogEntry}
                            onChange={(e) => setNewLogEntry(e.target.value)}
                            className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                          />
                          <div className="flex gap-3">
                            <Button
                              onClick={handleEditLog}
                              disabled={!newLogEntry}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Update Log
                            </Button>
                            <Button
                              onClick={handleDeleteLog}
                              variant="destructive"
                              className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Log
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeView === "settings" && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="p-3 rounded-full bg-gradient-to-r from-slate-100 to-gray-100 inline-block mb-4">
                        <Settings className="h-8 w-8 text-slate-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-slate-800 mb-2">
                        Admin Settings
                      </h2>
                      <p className="text-slate-600">
                        Configure system preferences
                      </p>
                    </div>

                    <Tabs defaultValue="general" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-xl">
                        <TabsTrigger
                          value="general"
                          className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                          General
                        </TabsTrigger>
                        <TabsTrigger
                          value="credentials"
                          className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                          Credentials
                        </TabsTrigger>
                        <TabsTrigger
                          value="data"
                          className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                          Data
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="general" className="space-y-4 mt-6">
                        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 space-y-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="minInterval"
                              className="text-sm font-semibold text-slate-700"
                            >
                              Minimum Capture Interval (minutes)
                            </Label>
                            <Input
                              id="minInterval"
                              type="number"
                              value={config.min_capture_interval_minutes || 5}
                              onChange={(e) =>
                                setConfig({
                                  ...config,
                                  min_capture_interval_minutes:
                                    Number.parseInt(e.target.value) || 5,
                                })
                              }
                              className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          </div>
                          <Button
                            onClick={handleSaveAdminSettings}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          >
                            <Save className="mr-2 h-4 w-4" />
                            Save Settings
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent
                        value="credentials"
                        className="space-y-4 mt-6"
                      >
                        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 space-y-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="oldPassword"
                              className="text-sm font-semibold text-slate-700"
                            >
                              Current Password
                            </Label>
                            <Input
                              id="oldPassword"
                              type="password"
                              placeholder="Enter current password"
                              value={oldAdminPassword}
                              onChange={(e) =>
                                setOldAdminPassword(e.target.value)
                              }
                              className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="newUsername"
                              className="text-sm font-semibold text-slate-700"
                            >
                              New Username (optional)
                            </Label>
                            <Input
                              id="newUsername"
                              placeholder="Enter new username"
                              value={newAdminUsername}
                              onChange={(e) =>
                                setNewAdminUsername(e.target.value)
                              }
                              className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="newPassword"
                              className="text-sm font-semibold text-slate-700"
                            >
                              New Password (optional)
                            </Label>
                            <Input
                              id="newPassword"
                              type="password"
                              placeholder="Enter new password"
                              value={newAdminPassword}
                              onChange={(e) =>
                                setNewAdminPassword(e.target.value)
                              }
                              className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          </div>
                          <Button
                            onClick={handleChangeAdminCredentials}
                            disabled={!oldAdminPassword || loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          >
                            {loading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Updating...
                              </>
                            ) : (
                              "Update Credentials"
                            )}
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="data" className="space-y-6 mt-6">
                        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6">
                          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Download className="h-5 w-5 text-blue-600" />
                            Backup & Restore
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Button
                              onClick={handleExportData}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Backup All Data
                            </Button>
                            <div>
                              <Input
                                type="file"
                                accept=".json"
                                onChange={handleImportData}
                                className="hidden"
                                id="import-file"
                              />
                              <Button
                                asChild
                                variant="outline"
                                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent"
                              >
                                <label
                                  htmlFor="import-file"
                                  className="cursor-pointer"
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  Restore from Backup
                                </label>
                              </Button>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl p-6 border border-red-100">
                          <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-red-600" />
                            Reset Data
                          </h3>
                          <Alert className="mb-4 border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-700">
                              This will permanently delete all registered faces,
                              attendance logs, and settings.
                            </AlertDescription>
                          </Alert>
                          <Button
                            onClick={handleResetData}
                            variant="destructive"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                          >
                            {loading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Resetting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Reset All Data
                              </>
                            )}
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
