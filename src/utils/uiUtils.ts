import type { CameraStatus } from "@/types/types";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import React from "react";

export const getBorderColorClass = (
  borderColor: CameraStatus["borderColor"]
): string => {
  switch (borderColor) {
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

export const getStatusIcon = (
  borderColor: CameraStatus["borderColor"]
): React.ReactElement => {
  if (borderColor === "success") {
    return React.createElement(CheckCircle, {
      className: "h-4 w-4 text-green-500",
    });
  } else if (borderColor === "warning") {
    return React.createElement(AlertCircle, {
      className: "h-4 w-4 text-yellow-500",
    });
  } else if (borderColor === "destructive") {
    return React.createElement(AlertCircle, {
      className: "h-4 w-4 text-red-500",
    });
  }

  return React.createElement(Clock, {
    className: "h-4 w-4 text-blue-500",
  });
};
