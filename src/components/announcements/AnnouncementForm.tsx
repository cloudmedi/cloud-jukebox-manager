import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

interface AnnouncementFormProps {
  announcement?: any;
  onSuccess?: () => void;
}

const AnnouncementForm = ({ announcement, onSuccess }: AnnouncementFormProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [startDate, setStartDate] = useState(announcement?.schedule?.startDate || new Date());
  const [endDate, setEndDate] = useState(announcement?.schedule?.endDate || new Date());
  const [repeatType, setRepeatType] = useState(announcement?.schedule?.repeatType || 'once');
  const [repeatDays, setRepeatDays] = useState(announcement?.schedule?.repeatDays || []);
  const [repeatTimes, setRepeatTimes] = useState(announcement?.schedule?.repeatTimes || ['']);
  const [selectedDevices, setSelectedDevices] = useState(announcement?.targetDevices || []);
  const [selectedGroups, setSelectedGroups] = useState(announcement?.targetGroups || []);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const weekDays = [
    { value: 0, label: 'Pazar' },
    { value: 1, label: 'Pazartesi' },
    { value: 2, label: 'Salı' },
    { value: 3, label: 'Çarşamba' },
    { value: 4, label: 'Perşembe' },
    { value: 5, label: 'Cuma' },
    { value: 6, label: 'Cumartesi' }
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Schedule data
    formData.append('schedule[startDate]', startDate.toISOString());
    formData.append('schedule[endDate]', endDate.toISOString());
    formData.append('schedule[repeatType]', repeatType);
    formData.append('schedule[repeatDays]', JSON.stringify(repeatDays));
    formData.append('schedule[repeatTimes]', JSON.stringify(repeatTimes));

    // Target devices and groups
    formData.append('targetDevices', JSON.stringify(selectedDevices));
    formData.append('targetGroups', JSON.stringify(selectedGroups));

    setUploading(true);
    setProgress(0);

    try {
      const url = announcement 
        ? `http://localhost:5000/api/announcements/${announcement._id}`
        : "http://localhost:5000/api/announcements";
      
      const method = announcement ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) throw new Error("İşlem başarısız");

      toast({
        title: "Başarılı",
        description: `Anons başarıyla ${announcement ? 'güncellendi' : 'oluşturuldu'}`,
      });

      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      if (onSuccess) onSuccess();
      e.currentTarget.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu",
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleAddTime = () => {
    setRepeatTimes([...repeatTimes, '']);
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...repeatTimes];
    newTimes[index] = value;
    setRepeatTimes(newTimes);
  };

  const handleRemoveTime = (index: number) => {
    setRepeatTimes(repeatTimes.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Başlık</Label>
          <Input 
            id="title" 
            name="title" 
            defaultValue={announcement?.title}
            required 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Açıklama</Label>
          <Textarea 
            id="content" 
            name="content" 
            defaultValue={announcement?.content}
            required 
          />
        </div>

        <div className="space-y-2">
          <Label>Zamanlama</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Başlangıç Tarihi</Label>
              <DatePicker
                date={startDate}
                setDate={setStartDate}
              />
            </div>
            <div className="space-y-2">
              <Label>Bitiş Tarihi</Label>
              <DatePicker
                date={endDate}
                setDate={setEndDate}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tekrar Tipi</Label>
          <Select value={repeatType} onValueChange={setRepeatType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="once">Bir Kez</SelectItem>
              <SelectItem value="daily">Her Gün</SelectItem>
              <SelectItem value="weekly">Her Hafta</SelectItem>
              <SelectItem value="monthly">Her Ay</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(repeatType === 'weekly' || repeatType === 'monthly') && (
          <div className="space-y-2">
            <Label>Tekrar Günleri</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {weekDays.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={repeatDays.includes(day.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setRepeatDays([...repeatDays, day.value]);
                      } else {
                        setRepeatDays(repeatDays.filter(d => d !== day.value));
                      }
                    }}
                  />
                  <Label htmlFor={`day-${day.value}`}>{day.label}</Label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Tekrar Saatleri</Label>
          {repeatTimes.map((time, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(index, e.target.value)}
                className="flex-1"
              />
              {index > 0 && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleRemoveTime(index)}
                >
                  Sil
                </Button>
              )}
            </div>
          ))}
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={handleAddTime}
          >
            Saat Ekle
          </Button>
        </div>

        {!announcement && (
          <div className="space-y-2">
            <Label htmlFor="file">Ses Dosyası</Label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    MP3 formatında ses dosyası yükleyin
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => document.getElementById("file")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Yükleniyor..." : "Dosya Seç"}
                </Button>
                <input
                  id="file"
                  name="file"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  required={!announcement}
                />
              </div>

              {uploading && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    Yükleniyor... {progress}%
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Button type="submit" disabled={uploading}>
        {announcement ? 'Anonsu Güncelle' : 'Anons Oluştur'}
      </Button>
    </form>
  );
};

export default AnnouncementForm;