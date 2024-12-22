import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function SettingsDialog() {
  const [autoPlay, setAutoPlay] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const { toast } = useToast();

  const handleSettingChange = (setting: string, value: boolean) => {
    switch (setting) {
      case 'autoPlay':
        setAutoPlay(value);
        break;
      case 'darkMode':
        setDarkMode(value);
        break;
      case 'notifications':
        setNotifications(value);
        break;
    }
    
    toast({
      title: "Ayarlar güncellendi",
      description: "Değişiklikler başarıyla kaydedildi.",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ayarlar</DialogTitle>
          <DialogDescription>
            Uygulama ayarlarını buradan yönetebilirsiniz.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-play">Otomatik Oynatma</Label>
            <Switch
              id="auto-play"
              checked={autoPlay}
              onCheckedChange={(checked) => handleSettingChange('autoPlay', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode">Karanlık Mod</Label>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">Bildirimler</Label>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}