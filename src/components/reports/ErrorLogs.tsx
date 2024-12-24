import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const ErrorLogs = () => {
  const [selectedType, setSelectedType] = useState<string>("all");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["error-logs", selectedType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedType !== "all") {
        params.append("type", selectedType);
      }
      params.append("limit", "50"); // Son 50 log

      const response = await fetch(`http://localhost:5000/api/stats/error-logs?${params}`);
      if (!response.ok) throw new Error("Hata logları yüklenemedi");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hata Logları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hata Logları</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Select
            value={selectedType}
            onValueChange={(value) => setSelectedType(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Log tipi seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="connection">Bağlantı</SelectItem>
              <SelectItem value="playlist">Playlist</SelectItem>
              <SelectItem value="playback">Çalma</SelectItem>
              <SelectItem value="system">Sistem</SelectItem>
            </SelectContent>
          </Select>

          <div className="space-y-2">
            {logs?.map((log: any) => (
              <Alert key={log._id} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {log.deviceId?.name || "Bilinmeyen Cihaz"}
                      </p>
                      <p className="text-sm">{log.message}</p>
                    </div>
                    <span className="text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ErrorLogs;