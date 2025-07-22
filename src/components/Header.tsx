import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getStatusIcon } from "@/utils/uiUtils";
import type { CameraStatus } from "@/types/types";

interface HeaderProps {
  statusMessage: string;
  cameraBorderColor: CameraStatus["borderColor"];
}

const Header: React.FC<HeaderProps> = ({
  statusMessage,
  cameraBorderColor,
}) => {
  return (
    <div className="mb-8">
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Face Attendance System
          </CardTitle>
          <div className="flex items-center justify-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
            {getStatusIcon(cameraBorderColor)}
            <p className="text-sm font-medium text-slate-700">
              {statusMessage}
            </p>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};

export default Header;
