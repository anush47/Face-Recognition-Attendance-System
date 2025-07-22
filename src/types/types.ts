export interface RegisteredFace {
  id: string;
  name: string;
  descriptor: number[];
}

export interface AppConfig {
  admin_username: string;
  admin_password: string;
  min_capture_interval_minutes: number;
}

export interface AttendanceRecord {
  employeeId: string;
  employeeName: string;
  timestamp: string;
}

export type ViewType =
  | "attendance"
  | "register"
  | "manage"
  | "reports"
  | "settings";

export interface CameraStatus {
  active: boolean;
  borderColor: "default" | "success" | "warning" | "destructive";
}
