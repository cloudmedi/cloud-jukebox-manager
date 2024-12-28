import { Home, Speaker, List, Calendar, Volume2, Upload, BarChart2 } from "lucide-react";
import {
  Sidebar as SidebarContainer,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";

const menuItems = [
  { title: "Ana Sayfa", icon: Home, path: "/" },
  { title: "Cihaz Yönetimi", icon: Speaker, path: "/devices" },
  { title: "Playlist Yönetimi", icon: List, path: "/playlists" },
  { title: "Zamanlama", icon: Calendar, path: "/schedule" },
  { title: "Anons Yönetimi", icon: Volume2, path: "/announcements" },
  { title: "Music Upload", icon: Upload, path: "/upload" },
  { title: "Raporlama", icon: BarChart2, path: "/reports" },
];

const Sidebar = () => {
  return (
    <SidebarContainer>
      <SidebarContent>
        <div className="p-4">
          <h1 className="text-2xl font-bold">Cloud Media</h1>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.path} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-4 py-2 text-sm text-muted-foreground">
          V2.1
        </div>
      </SidebarFooter>
    </SidebarContainer>
  );
};

export default Sidebar;