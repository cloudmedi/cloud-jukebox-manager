import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addDays } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/hooks/use-toast";
import { DeviceSearch } from "./device-playback/DeviceSearch";
import { DateTimeRangePicker } from "./device-playback/DateTimeRangePicker";
import { PlaybackTable } from "./device-playback/PlaybackTable";
import { DateRange } from "react-day-picker";

export default function DevicePlaybackReport() {
  const { toast } = useToast();
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7)
  });
  const [timeRange, setTimeRange] = useState({
    startTime: "00:00",
    endTime: "23:59"
  });

  // Fetch devices
  const { data: devices, isLoading: devicesLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) throw new Error("Cihazlar yüklenemedi");
      return response.json();
    },
  });

  // Fetch playback data for selected device
  const { data: playbackData, isLoading: playbackLoading } = useQuery({
    queryKey: ["device-playback", selectedDevice, dateRange, timeRange],
    queryFn: async () => {
      if (!selectedDevice || !dateRange?.from || !dateRange?.to) return null;
      const response = await fetch(
        `http://localhost:5000/api/stats/device-playback?deviceId=${selectedDevice}&from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}&startTime=${timeRange.startTime}&endTime=${timeRange.endTime}`
      );
      if (!response.ok) throw new Error("Çalma verileri yüklenemedi");
      return response.json();
    },
    enabled: !!selectedDevice && !!dateRange?.from && !!dateRange?.to,
  });

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  const generatePDF = () => {
    if (!dateRange?.from || !dateRange?.to) return;
    
    const doc = new jsPDF();
    const deviceName = devices?.find((d) => d._id === selectedDevice)?.name || "Cihaz";
    
    doc.setFontSize(16);
    doc.text(`${deviceName} - Çalma Raporu`, 14, 15);
    doc.setFontSize(11);
    doc.text(
      `Tarih: ${dateRange.from.toLocaleDateString()} ${timeRange.startTime} - ${dateRange.to.toLocaleDateString()} ${timeRange.endTime}`,
      14,
      25
    );

    const tableData = playbackData?.map((item: any) => [
      item.songName,
      item.artist,
      item.playCount.toString(),
      Math.round(item.totalDuration / 60).toString() + " dk",
      new Date(item.lastPlayed).toLocaleDateString()
    ]);

    autoTable(doc, {
      head: [["Şarkı", "Sanatçı", "Çalınma Sayısı", "Toplam Süre", "Son Çalınma"]],
      body: tableData || [],
      startY: 35,
    });

    doc.save(`${deviceName}-calma-raporu-${new Date().toISOString().split('T')[0]}.pdf`);
    toast({
      title: "PDF oluşturuldu",
      description: "Rapor başarıyla indirildi.",
    });
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
          onDateRangeChange={handleDateRangeChange}
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