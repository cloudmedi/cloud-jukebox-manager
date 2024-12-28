import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { useToast } from "@/components/ui/use-toast";

export const ExportOptions = () => {
  const { toast } = useToast();
  
  const { data: stats } = useQuery({
    queryKey: ['group-stats'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/stats/groups');
      if (!response.ok) throw new Error('İstatistikler yüklenemedi');
      return response.json();
    },
  });

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Grup İstatistikleri Raporu', 14, 15);
    
    doc.setFontSize(11);
    doc.text(`Oluşturulma Tarihi: ${new Date().toLocaleDateString()}`, 14, 25);

    const tableData = stats?.groupStats?.map((group: any) => [
      group.name,
      group.totalDevices,
      group.activeDevices,
      `${((group.activeDevices / group.totalDevices) * 100).toFixed(1)}%`,
      group.status
    ]) || [];

    autoTable(doc, {
      head: [['Grup Adı', 'Toplam Cihaz', 'Aktif Cihaz', 'Aktif Oranı', 'Durum']],
      body: tableData,
      startY: 35,
    });

    doc.save('grup-istatistikleri.pdf');
    
    toast({
      title: "Rapor indirildi",
      description: "Grup istatistikleri PDF olarak kaydedildi.",
    });
  };

  const handleExportCSV = () => {
    if (!stats?.groupStats) return;

    const csvContent = [
      ['Grup Adı', 'Toplam Cihaz', 'Aktif Cihaz', 'Aktif Oranı', 'Durum'],
      ...stats.groupStats.map((group: any) => [
        group.name,
        group.totalDevices,
        group.activeDevices,
        `${((group.activeDevices / group.totalDevices) * 100).toFixed(1)}%`,
        group.status
      ])
    ]
    .map(row => row.join(','))
    .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'grup-istatistikleri.csv';
    link.click();
    
    toast({
      title: "Rapor indirildi",
      description: "Grup istatistikleri CSV olarak kaydedildi.",
    });
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleExportPDF} className="gap-2">
        <Download className="h-4 w-4" />
        PDF İndir
      </Button>
      <Button onClick={handleExportCSV} variant="outline" className="gap-2">
        <FileText className="h-4 w-4" />
        CSV İndir
      </Button>
    </div>
  );
};