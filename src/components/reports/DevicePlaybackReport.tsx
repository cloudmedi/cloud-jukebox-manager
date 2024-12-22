import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { addDays } from "date-fns";
import { Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/hooks/use-toast";

interface PlaybackData {
  songName: string;
  artist: string;
  playCount: number;
  totalDuration: number;
  lastPlayed: string;
}

const DevicePlaybackReport = () => {
  const { toast } = useToast();
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: addDays(new Date(), 7),
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
    queryKey: ["device-playback", selectedDevice, dateRange],
    queryFn: async () => {
      if (!selectedDevice) return null;
      const response = await fetch(
        `http://localhost:5000/api/stats/device-playback?deviceId=${selectedDevice}&from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`
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
    doc.text(`Tarih Aralığı: ${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`, 14, 25);

    const tableData = playbackData?.map((item: PlaybackData) => [
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

  if (devicesLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cihaz Çalma Raporu</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Select value={selectedDevice} onValueChange={setSelectedDevice}>
            <SelectTrigger>
              <SelectValue placeholder="Cihaz seçin" />
            </SelectTrigger>
            <SelectContent>
              {devices?.map((device: any) => (
                <SelectItem key={device._id} value={device._id}>
                  {device.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DatePickerWithRange
            date={dateRange}
            setDate={setDateRange}
          />

          <Button
            onClick={generatePDF}
            disabled={!playbackData || playbackLoading}
            className="w-full md:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            PDF İndir
          </Button>
        </div>

        {playbackLoading ? (
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : playbackData ? (
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left">Şarkı</th>
                  <th className="p-2 text-left">Sanatçı</th>
                  <th className="p-2 text-left">Çalınma Sayısı</th>
                  <th className="p-2 text-left">Toplam Süre</th>
                  <th className="p-2 text-left">Son Çalınma</th>
                </tr>
              </thead>
              <tbody>
                {playbackData.map((item: PlaybackData, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{item.songName}</td>
                    <td className="p-2">{item.artist}</td>
                    <td className="p-2">{item.playCount}</td>
                    <td className="p-2">{Math.round(item.totalDuration / 60)} dk</td>
                    <td className="p-2">
                      {new Date(item.lastPlayed).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default DevicePlaybackReport;