import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UserPlus,
  Users,
  FileText,
  Settings,
  LogOut,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";
import type { ViewType } from "@/types/types";

interface AdminPanelProps {
  adminLoggedIn: boolean;
  adminUsername: string;
  setAdminUsername: (username: string) => void;
  adminPassword: string;
  setAdminPassword: (password: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  loading: boolean;
  handleAdminLogin: () => Promise<void>;
  handleAdminLogout: () => void;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  adminLoggedIn,
  adminUsername,
  setAdminUsername,
  adminPassword,
  setAdminPassword,
  showPassword,
  setShowPassword,
  loading,
  handleAdminLogin,
  handleAdminLogout,
  activeView,
  setActiveView,
}) => {
  return (
    <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          {adminLoggedIn ? (
            <>
              <Settings className="h-5 w-5 text-indigo-600" />
              Admin Panel
            </>
          ) : (
            <>
              <Users className="h-5 w-5 text-indigo-600" />
              Admin Access
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!adminLoggedIn ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-sm font-medium text-slate-700"
              >
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-400" />
                  )}
                </Button>
              </div>
            </div>
            <Button
              onClick={handleAdminLogin}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2.5"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Button
              variant={activeView === "attendance" ? "default" : "outline"}
              className={`flex flex-col items-center gap-2 h-auto py-4 ${
                activeView === "attendance"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
              onClick={() => setActiveView("attendance")}
            >
              <Clock className="h-5 w-5" />
              <span className="text-xs font-medium">Attendance</span>
            </Button>
            <Button
              variant={activeView === "register" ? "default" : "outline"}
              className={`flex flex-col items-center gap-2 h-auto py-4 ${
                activeView === "register"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
              onClick={() => setActiveView("register")}
            >
              <UserPlus className="h-5 w-5" />
              <span className="text-xs font-medium">Register</span>
            </Button>
            <Button
              variant={activeView === "manage" ? "default" : "outline"}
              className={`flex flex-col items-center gap-2 h-auto py-4 ${
                activeView === "manage"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
              onClick={() => setActiveView("manage")}
            >
              <Users className="h-5 w-5" />
              <span className="text-xs font-medium">Manage</span>
            </Button>
            <Button
              variant={activeView === "reports" ? "default" : "outline"}
              className={`flex flex-col items-center gap-2 h-auto py-4 ${
                activeView === "reports"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
              onClick={() => setActiveView("reports")}
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs font-medium">Reports</span>
            </Button>
            <Button
              variant={activeView === "settings" ? "default" : "outline"}
              className={`flex flex-col items-center gap-2 h-auto py-4 ${
                activeView === "settings"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
              onClick={() => setActiveView("settings")}
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs font-medium">Settings</span>
            </Button>
            <div className="col-span-2 md:col-span-3 lg:col-span-5">
              <Button
                variant="outline"
                className="w-full justify-center border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                onClick={handleAdminLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminPanel;
