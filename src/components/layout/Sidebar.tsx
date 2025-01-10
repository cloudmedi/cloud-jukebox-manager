import { Home, Speaker, List, Calendar, Volume2, Upload, BarChart2, Music2 } from "lucide-react";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

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
  const location = useLocation();

  const { data: devices } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) {
        throw new Error("Cihazlar yüklenirken bir hata oluştu");
      }
      return response.json();
    },
    refetchInterval: 5000
  });

  const onlineDeviceCount = devices?.filter(d => d.isOnline).length || 0;

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-50/30 to-transparent pointer-events-none" />
      <SidebarContainer className="min-h-screen !bg-transparent">
        <SidebarContent>
          <div className="flex items-center gap-3 p-6">
            <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 p-2.5 rounded-2xl">
              <Music2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-semibold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Cloud Jukebox
              </h1>
              <p className="text-xs text-gray-500">Müzik Yönetim Sistemi</p>
            </div>
          </div>

          <div className="px-3 pt-2">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;

                    return (
                      <SidebarMenuItem key={item.title} className="mb-1">
                        <SidebarMenuButton asChild>
                          <Link
                            to={item.path}
                            className={cn(
                              "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                              isActive
                                ? "bg-black/5 text-primary font-medium"
                                : "text-gray-600 hover:bg-black/5 hover:text-gray-900"
                            )}
                          >
                            <item.icon className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              "group-hover:scale-110",
                              isActive && "text-primary"
                            )} />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        </SidebarContent>

        <SidebarFooter className="p-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 bg-black/5 px-3 py-2 rounded-xl">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/20"></span>
              <span className="text-gray-600">{onlineDeviceCount} Cihaz Aktif</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-black/5 text-gray-500">v2.1.0</div>
          </div>
        </SidebarFooter>
      </SidebarContainer>
    </div>
  );
};

export default Sidebar;
