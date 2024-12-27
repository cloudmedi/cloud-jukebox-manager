import { Home, Speaker, List, Calendar, Volume2, Upload, BarChart2, Settings, Users, ChevronDown } from "lucide-react";
import {
  Sidebar as SidebarContainer,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";

const menuItems = [
  { 
    title: "Ana Sayfa", 
    icon: Home, 
    path: "/" 
  },
  { 
    title: "Cihaz Yönetimi", 
    icon: Speaker, 
    path: "/devices",
    subItems: [
      { title: "Cihaz Listesi", path: "/devices" },
      { title: "Cihaz Grupları", path: "/devices/groups" }
    ]
  },
  { 
    title: "Playlist Yönetimi", 
    icon: List, 
    path: "/playlists",
    subItems: [
      { title: "Tüm Playlistler", path: "/playlists" },
      { title: "Yeni Playlist", path: "/playlists/new" }
    ]
  },
  { 
    title: "Zamanlama", 
    icon: Calendar, 
    path: "/schedule" 
  },
  { 
    title: "Anons Yönetimi", 
    icon: Volume2, 
    path: "/announcements" 
  },
  { 
    title: "Music Upload", 
    icon: Upload, 
    path: "/upload" 
  },
  { 
    title: "Raporlama", 
    icon: BarChart2, 
    path: "/reports" 
  },
];

const Sidebar = () => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleSubMenu = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  return (
    <TooltipProvider>
      <SidebarContainer>
        <SidebarContent>
          <div className="p-4">
            <h1 className="text-2xl font-bold">Cloud Media</h1>
          </div>
          <SidebarGroup>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarGroupLabel>Menu</SidebarGroupLabel>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ana Navigasyon Menüsü</p>
              </TooltipContent>
            </Tooltip>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        location.pathname === item.path ||
                        (item.subItems?.some(sub => location.pathname === sub.path))
                      }
                      onClick={() => item.subItems && toggleSubMenu(item.title)}
                      className="group"
                    >
                      <Link to={item.path} className="flex items-center gap-3 w-full">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                        {item.subItems && (
                          <ChevronDown 
                            className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                              expandedItems.includes(item.title) ? 'rotate-180' : ''
                            }`}
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                    {item.subItems && expandedItems.includes(item.title) && (
                      <SidebarMenuSub>
                        {item.subItems.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === subItem.path}
                            >
                              <Link to={subItem.path}>{subItem.title}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </SidebarContainer>
    </TooltipProvider>
  );
};

export default Sidebar;