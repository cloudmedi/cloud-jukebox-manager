import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DateTimeRangePicker } from "./device-playback/DateTimeRangePicker";
import { PlaybackTable } from "./device-playback/PlaybackTable";
import { DeviceSearch } from "./device-playback/DeviceSearch";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";

// Roboto fontunu import et
import robotoNormal from '@/assets/fonts/Roboto-Regular-normal.js';
import robotoMedium from '@/assets/fonts/Roboto-Medium-normal.js';

interface Device {
  _id: string; // Bu artık token değeri
  name: string;
  location?: string;
  originalId: string; // Orijinal cihaz ID'si
}

interface PlaybackData {
  songName: string;
  artist: string;
  playedAt: string;
  duration: number;
}

interface TimeRange {
  startTime: string;
  endTime: string;
}

export default function DevicePlaybackReport() {
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [timeRange, setTimeRange] = useState<TimeRange>({
    startTime: "00:00",
    endTime: "23:59",
  });

  const { data: devices = [], isLoading: devicesLoading } = useQuery<Device[]>({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/stats/devices");
      if (!response.ok) {
        throw new Error("Cihazlar yüklenemedi");
      }
      return response.json();
    },
  });

  const selectedDeviceData = devices.find(d => d._id === selectedDevice);
  console.log('Seçilen cihaz:', selectedDeviceData);

  const { data: playbackData = [], isLoading: playbackLoading } = useQuery<PlaybackData[]>({
    queryKey: ["device-playback", selectedDevice, dateRange, timeRange],
    queryFn: async () => {
      console.log('PlaybackData query çalışıyor', {
        selectedDevice,
        dateRange,
        timeRange,
        selectedDeviceData
      });

      if (!selectedDevice || !dateRange?.from || !dateRange?.to) {
        console.log('Query koşulları sağlanmadı:', {
          selectedDevice,
          dateFrom: dateRange?.from,
          dateTo: dateRange?.to
        });
        return [];
      }

      try {
        const params = new URLSearchParams({
          deviceId: selectedDevice,
          from: format(dateRange.from, "yyyy-MM-dd"),
          to: format(dateRange.to, "yyyy-MM-dd"),
          startTime: timeRange.startTime,
          endTime: timeRange.endTime
        });

        console.log('API isteği parametreleri:', Object.fromEntries(params));

        const response = await fetch(
          `http://localhost:5000/api/stats/device-playback?${params}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error('API yanıtı hata:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          throw new Error(errorData.message || "Çalma verileri yüklenemedi");
        }
        
        const data = await response.json();
        console.log('API yanıtı başarılı:', data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Çalma verileri yüklenirken hata:", error);
        toast.error("Çalma verileri yüklenirken bir hata oluştu");
        return [];
      }
    },
    enabled: Boolean(selectedDevice && dateRange?.from && dateRange?.to)
  });

  const generatePDF = () => {
    if (!dateRange?.from || !dateRange?.to || !playbackData.length || !selectedDeviceData) {
      toast.error("İndirilecek veri bulunamadı");
      return;
    }
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        floatPrecision: 16
      });
      
      // Başlık
      doc.setFontSize(16);
      doc.text(`${selectedDeviceData.name} - Calma Raporu`, 14, 15);
      
      // Cihaz ve Tarih aralığı
      doc.setFontSize(11);
      doc.text(
        `Cihaz: ${selectedDeviceData.name}`,
        14,
        25
      );
      doc.text(
        `Tarih: ${format(dateRange.from, "dd.MM.yyyy")} ${timeRange.startTime} - ${format(dateRange.to, "dd.MM.yyyy")} ${timeRange.endTime}`,
        14,
        32
      );

      // Tablo
      autoTable(doc, {
        startY: 40,
        head: [["Sarki", "Sanatci", "Calinma Zamani", "Sure (dk)"]],
        body: playbackData.map((item) => [
          item.songName,
          item.artist,
          format(new Date(item.playedAt), "dd.MM.yyyy HH:mm"),
          Math.round(item.duration / 60).toString()
        ]),
        styles: { 
          fontSize: 9, 
          cellPadding: 2,
        },
        headStyles: { 
          fillColor: [66, 66, 66],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: {
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      });

      // Dosyayı indir
      const fileName = selectedDeviceData.name
        .replace(/[çÇ]/g, 'c')
        .replace(/[ğĞ]/g, 'g')
        .replace(/[ıİ]/g, 'i')
        .replace(/[öÖ]/g, 'o')
        .replace(/[şŞ]/g, 's')
        .replace(/[üÜ]/g, 'u')
        .replace(/[^a-zA-Z0-9]/g, '-');

      doc.save(`${fileName}-calma-raporu-${format(new Date(), "dd-MM-yyyy")}.pdf`);
      toast.success("Rapor başarıyla indirildi");
    } catch (error) {
      console.error("PDF oluşturulurken hata:", error);
      toast.error("Rapor oluşturulurken bir hata oluştu");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <DeviceSearch
          devices={devices}
          selectedDevice={selectedDevice}
          onDeviceSelect={setSelectedDevice}
          isLoading={devicesLoading}
        />
        <DateTimeRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      </div>

      <div className="flex justify-end">
        <Button
          onClick={generatePDF}
          disabled={!playbackData.length}
        >
          PDF Oluştur
        </Button>
      </div>

      <PlaybackTable
        data={playbackData}
        isLoading={playbackLoading}
      />
    </div>
  );
}