import { useState, useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import { toast } from "sonner";
import type { RegisteredFace, CameraStatus, AppConfig } from "@/types/types";
import {
  saveFaceData,
  addAttendanceLog,
  loadFaceData,
} from "@/utils/data-manager";

const MODEL_URL = import.meta.env.BASE_URL;

interface UseFaceRecognitionProps {
  config: AppConfig;
  lastAttendanceTime: Record<string, Date>;
  setLastAttendanceTime: React.Dispatch<
    React.SetStateAction<Record<string, Date>>
  >;
  realtimeDetectionEnabled: boolean;
}

export const useFaceRecognition = ({
  config,
  lastAttendanceTime,
  setLastAttendanceTime,
  realtimeDetectionEnabled,
}: UseFaceRecognitionProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>({
    active: false,
    borderColor: "default",
  });
  const [statusMessage, setStatusMessage] = useState("Loading models...");
  const [loading, setLoading] = useState(false);
  const [registeredFaces, setRegisteredFaces] = useState<RegisteredFace[]>([]);
  const [internalLabeledFaceDescriptors, setInternalLabeledFaceDescriptors] =
    useState<faceapi.LabeledFaceDescriptors[] | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const updateStatus = (
    message: string,
    borderColor: CameraStatus["borderColor"] = "default"
  ) => {
    setStatusMessage(message);
    setCameraStatus((prev) => ({ ...prev, borderColor }));

    toast(message);
  };

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

  const initializeApp = async () => {
    try {
      setLoading(true);
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      setModelsLoaded(true);
      updateStatus("Models loaded. Loading configuration...", "default");
      console.log("Real time detection: ", realtimeDetectionEnabled);
      loadRegisteredFaces();
    } catch (error) {
      console.error("Error initializing app:", error);
      updateStatus(
        "Error initializing app. Please check console.",
        "destructive"
      );
      toast("Failed to load face recognition models.");
    } finally {
      setLoading(false);
    }
  };

  const loadRegisteredFaces = () => {
    try {
      const faces = loadFaceData();
      setRegisteredFaces(faces);
      updateStatus(`Loaded ${faces.length} registered faces.`, "default");
    } catch (error) {
      console.error("Error loading registered faces:", error);
      updateStatus("Error loading registered faces.", "destructive");
    }
  };

  const startCamera = async () => {
    if (cameraStatus.active) return;
    try {
      setLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraStatus({ active: true, borderColor: "success" });
      updateStatus("Camera active. Ready for attendance.", "success");
    } catch (error) {
      console.error("Error accessing camera:", error);
      updateStatus(
        "Error accessing camera. Please ensure camera permissions are granted.",
        "destructive"
      );
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraStatus({ active: false, borderColor: "default" });
    updateStatus("Camera stopped.", "default");
  };

  const handleVideoPlay = (realtimeEnabled: boolean) => {
    if (!canvasRef.current || !videoRef.current) return;

    if (
      videoRef.current.videoWidth === 0 ||
      videoRef.current.videoHeight === 0
    ) {
      setTimeout(() => handleVideoPlay(realtimeEnabled), 1000);
      return;
    }

    const displaySize = {
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight,
    };
    faceapi.matchDimensions(canvasRef.current, displaySize);

    const interval = setInterval(async () => {
      if (
        !videoRef.current ||
        videoRef.current.paused ||
        videoRef.current.ended ||
        !modelsLoaded
      ) {
        return;
      }

      const context = canvasRef.current?.getContext("2d");
      if (context && canvasRef.current) {
        context.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
      }

      if (realtimeEnabled) {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options())
          .withFaceLandmarks()
          .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );

        if (context && canvasRef.current) {
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);

          if (internalLabeledFaceDescriptors) {
            const faceMatcher = new faceapi.FaceMatcher(
              internalLabeledFaceDescriptors,
              0.6
            );
            resizedDetections.forEach((detection) => {
              const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
              const box = detection.detection.box;
              const drawBox = new faceapi.draw.DrawBox(box, {
                label: bestMatch.toString(),
              });
              drawBox.draw(canvasRef.current!);
            });
          }
        }
      }
    }, 100);

    return () => clearInterval(interval);
  };

  const handleRegisterFace = async (regEmployeeId: string, regName: string) => {
    if (!regEmployeeId || !regName) {
      updateStatus("Please enter both Employee ID and Name.", "warning");
      return;
    }
    if (!cameraStatus.active || !videoRef.current) {
      updateStatus("Camera not active. Please start camera.", "warning");
      return;
    }

    setLoading(true);
    try {
      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detections) {
        saveFaceData(regEmployeeId, regName, detections.descriptor);
        loadRegisteredFaces();
        updateStatus(
          `Face for ${regName} (ID: ${regEmployeeId}) registered successfully!`,
          "success"
        );
      } else {
        updateStatus(
          "No face detected. Please ensure your face is clearly visible.",
          "warning"
        );
      }
    } catch (error) {
      updateStatus(
        `Registration Error: ${(error as Error).message}`,
        "destructive"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!cameraStatus.active || !videoRef.current) {
      updateStatus("Camera not active. Please start camera.", "warning");
      return;
    }
    if (
      !internalLabeledFaceDescriptors ||
      internalLabeledFaceDescriptors.length === 0
    ) {
      updateStatus(
        "No faces registered. Please register faces first.",
        "warning"
      );
      return;
    }

    setLoading(true);
    try {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        updateStatus("No face detected for attendance.", "warning");
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
              (currentTime.getTime() -
                lastAttendanceTime[employeeId].getTime()) /
              (1000 * 60);
            if (timeDifference < minInterval) {
              updateStatus(
                `${employeeName} (ID: ${employeeId}) already marked attendance recently. Please wait ${Math.ceil(
                  minInterval - timeDifference
                )} minutes.`,
                "warning"
              );
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
          updateStatus(
            `Attendance Marked for: ${employeeName} (ID: ${employeeId})`,
            "success"
          );
          markedCount++;
        } else {
          unknownCount++;
        }
      }

      if (markedCount === 0 && unknownCount > 0) {
        updateStatus("Unknown face detected.", "destructive");
      } else if (markedCount === 0 && timeoutCount === 0) {
        updateStatus("No registered faces detected for attendance.", "warning");
      }
    } catch (error) {
      updateStatus(
        "Error marking attendance. Please try again.",
        "destructive"
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    videoRef,
    canvasRef,
    modelsLoaded,
    cameraStatus,
    statusMessage,
    loading,
    registeredFaces,
    internalLabeledFaceDescriptors,
    updateStatus,
    setRegisteredFaces,
    setInternalLabeledFaceDescriptors,
    initializeApp,
    loadRegisteredFaces,
    startCamera,
    stopCamera,
    handleVideoPlay,
    handleRegisterFace,
    handleMarkAttendance,
  };
};
