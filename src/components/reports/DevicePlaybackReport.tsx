import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addDays, format } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { DeviceSearch } from "./device-playback/DeviceSearch";
import { DateTimeRangePicker } from "./device-playback/DateTimeRangePicker";
import { PlaybackTable } from "./device-playback/PlaybackTable";
import { DateRange } from "react-day-picker";

interface Device {
  _id: string;
  name: string;
  location?: string;
}

interface PlaybackData {
  songName: string;
  artist: string;
  playCount: number;
  totalDuration: number;
  lastPlayed: string;
}

export default function DevicePlaybackReport() {
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7)
  });
  const [timeRange, setTimeRange] = useState({
    startTime: "00:00",
    endTime: "23:59"
  });

  // Cihazları getir
  const { data: devices = [], isLoading: devicesLoading } = useQuery<Device[]>({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) {
        throw new Error("Cihazlar yüklenemedi");
      }
      return response.json();
    }
  });

  // Çalma verilerini getir
  const { data: playbackData = [], isLoading: playbackLoading } = useQuery<PlaybackData[]>({
    queryKey: ["device-playback", selectedDevice, dateRange, timeRange],
    queryFn: async () => {
      if (!selectedDevice || !dateRange?.from || !dateRange?.to) {
        return [];
      }

      const params = new URLSearchParams({
        deviceId: selectedDevice,
        from: format(dateRange.from, "yyyy-MM-dd"),
        to: format(dateRange.to, "yyyy-MM-dd"),
        startTime: timeRange.startTime,
        endTime: timeRange.endTime
      });

      const response = await fetch(
        `http://localhost:5000/api/stats/device-playback?${params}`
      );

      if (!response.ok) {
        throw new Error("Çalma verileri yüklenemedi");
      }
      return response.json();
    },
    enabled: Boolean(selectedDevice && dateRange?.from && dateRange?.to)
  });

  const generatePDF = () => {
    if (!dateRange?.from || !dateRange?.to || !playbackData) return;
    
    const doc = new jsPDF();
    const deviceName = devices.find((d) => d._id === selectedDevice)?.name || "Cihaz";
    
    doc.setFontSize(16);
    doc.text(`${deviceName} - Çalma Raporu`, 14, 15);
    doc.setFontSize(11);
    doc.text(
      `Tarih: ${format(dateRange.from, "dd/MM/yyyy")} ${timeRange.startTime} - ${format(dateRange.to, "dd/MM/yyyy")} ${timeRange.endTime}`,
      14,
      25
    );

    const tableData = playbackData.map((item) => [
      item.songName,
      item.artist,
      item.playCount.toString(),
      Math.round(item.totalDuration / 60).toString() + " dk",
      new Date(item.lastPlayed).toLocaleDateString()
    ]);

    autoTable(doc, {
      head: [["Şarkı", "Sanatçı", "Çalınma Sayısı", "Toplam Süre", "Son Çalınma"]],
      body: tableData,
      startY: 35,
    });

    doc.save(`${deviceName}-calma-raporu-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("PDF başarıyla oluşturuldu");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cihaz Çalma Raporu</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <DeviceSearch
          devices={devices}
          selectedDevice={selectedDevice}
          onDeviceSelect={setSelectedDevice}
          isLoading={devicesLoading}
        />

        <DateTimeRangePicker
          dateRange={dateRange}
          timeRange={timeRange}
          onDateRangeChange={setDateRange}
          onTimeRangeChange={(type, value) =>
            setTimeRange(prev => ({ ...prev, [type]: value }))
          }
          showDownloadButton={!!selectedDevice}
          isDownloadDisabled={!playbackData || playbackLoading}
          onDownload={generatePDF}
        />

        <PlaybackTable
          data={playbackData}
          isLoading={playbackLoading}
        />
      </CardContent>
    </Card>
  );
}