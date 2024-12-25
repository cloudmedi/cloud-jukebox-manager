import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { NotificationsPopover } from "@/components/notifications/NotificationsPopover";
import { Link } from "react-router-dom";
import { Home, Speaker, List, Calendar, Volume2, Upload, BarChart2 } from "lucide-react";

const menuItems = [
  { title: "Ana Sayfa", icon: Home, path: "/" },
  { title: "Cihaz Yönetimi", icon: Speaker, path: "/devices" },
  { title: "Playlist Yönetimi", icon: List, path: "/playlists" },
  { title: "Zamanlama", icon: Calendar, path: "/schedule" },
  { title: "Anons Yönetimi", icon: Volume2, path: "/announcements" },
  { title: "Music Upload", icon: Upload, path: "/upload" },
  { title: "Raporlama", icon: BarChart2, path: "/reports" },
];

const Header = () => {
  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-12 items-center px-4">
        <div className="flex-1">
          <nav className="flex items-center space-x-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-accent/50 hover:text-primary transition-colors"
              >
                <item.icon className="h-3.5 w-3.5" />
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <NotificationsPopover />
          <SettingsDialog />
        </div>
      </div>
    </header>
  );
};

export default Header;