import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { addDays } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/hooks/use-toast";
import { DeviceSearch } from "./DeviceSearch";
import { DateTimeRangePicker } from "./DateTimeRangePicker";
import { PlaybackTable } from "./PlaybackTable";

export default function DevicePlaybackReport() {
  const { toast } = useToast();
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: addDays(new Date(), 7),
  });
  const [timeRange, setTimeRange] = useState({
    startTime: "00:00",
    endTime: "23:59"
  });

  // Cihazları getir
  const { data: devices, isLoading: devicesLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) throw new Error("Cihazlar yüklenemedi");
      return response.json();
    },
  });

  // Seçili cihazın çalma verilerini getir
  const { data: playbackData, isLoading: playbackLoading } = useQuery({
    queryKey: ["device-playback", selectedDevice, dateRange, timeRange],
    queryFn: async () => {
      if (!selectedDevice) return null;
      const response = await fetch(
        `http://localhost:5000/api/stats/device-playback?deviceId=${selectedDevice}&from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}&startTime=${timeRange.startTime}&endTime=${timeRange.endTime}`
      );
      if (!response.ok) throw new Error("Çalma verileri yüklenemedi");
      return response.json();
    },
    enabled: !!selectedDevice,
  });

  const generatePDF = () => {
    const doc = new jsPDF();
    const deviceName = devices?.find((d: any) => d._id === selectedDevice)?.name || "Cihaz";
    
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
          onDateRangeChange={setDateRange}
          onTimeRangeChange={(type, value) =>
            setTimeRange(prev => ({ ...prev, [type]: value }))
          }
        />

        {selectedDevice && (
          <Button
            onClick={generatePDF}
            disabled={!playbackData || playbackLoading}
            className="w-full md:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            PDF İndir
          </Button>
        )}

        <PlaybackTable
          data={playbackData}
          isLoading={playbackLoading}
        />
      </CardContent>
    </Card>
  );
}