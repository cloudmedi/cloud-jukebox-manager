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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  return (
    <SidebarContainer>
      <SidebarContent>
        <div className="p-4">
          <h1 className="text-2xl font-bold">Cloud Media</h1>
        </div>
        <TooltipProvider delayDuration={300}>
          <SidebarGroup>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarGroupLabel>Menu</SidebarGroupLabel>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Ana Navigasyon Menüsü</p>
              </TooltipContent>
            </Tooltip>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`relative ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-primary before:content-[''] shadow-md"
                            : ""
                        }`}
                      >
                        <Link to={item.path} className="flex items-center gap-3">
                          <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </TooltipProvider>
      </SidebarContent>
    </SidebarContainer>
  );
};

export default Sidebar;