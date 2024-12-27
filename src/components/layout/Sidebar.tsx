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
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Ana Sayfa", icon: Home, path: "/" },
  { title: "Cihazlar", icon: Speaker, path: "/devices" },
  { title: "Playlistler", icon: List, path: "/playlists" },
  { title: "Zamanlama", icon: Calendar, path: "/schedule" },
  { title: "Anonslar", icon: Volume2, path: "/announcements" },
  { title: "Müzik Yükle", icon: Upload, path: "/upload" },
  { title: "Raporlar", icon: BarChart2, path: "/reports" },
];

const Sidebar = () => {
  const location = useLocation();
  
  return (
    <SidebarContainer className="bg-white border-r border-gray-200">
      <SidebarContent>
        <div className="p-4">
          <h1 className="text-xl font-semibold text-gray-900">Cloud Media</h1>
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.path} 
                      className={cn(
                        "flex items-center gap-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                        location.pathname === item.path && "text-blue-600 bg-blue-50 hover:bg-blue-50 hover:text-blue-600"
                      )}
                    >
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
    </SidebarContainer>
  );
};

export default Sidebar;