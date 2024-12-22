import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Moon, Sun, Monitor } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme/ThemeProvider";

export function SettingsDialog() {
  const [autoPlay, setAutoPlay] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const handleSettingChange = (setting: string, value: boolean) => {
    switch (setting) {
      case 'autoPlay':
        setAutoPlay(value);
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
            <Label htmlFor="notifications">Bildirimler</Label>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
            />
          </div>
          <div className="space-y-2">
            <Label>Tema</Label>
            <div className="flex items-center gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="icon"
                onClick={() => setTheme("light")}
                className="w-10 h-10"
              >
                <Sun className="h-5 w-5" />
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="icon"
                onClick={() => setTheme("dark")}
                className="w-10 h-10"
              >
                <Moon className="h-5 w-5" />
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="icon"
                onClick={() => setTheme("system")}
                className="w-10 h-10"
              >
                <Monitor className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}