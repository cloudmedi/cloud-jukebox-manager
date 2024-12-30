import { Link } from "react-router-dom";
import { Home, Speaker, List, Calendar, Volume2, Upload, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const TopNavigation = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">veeq</h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-[#333333] hover:text-black font-medium">
              Home
            </Link>
            <Link to="/devices" className="text-[#333333] hover:text-black font-medium">
              Devices
            </Link>
            <Link to="/playlists" className="text-[#333333] hover:text-black font-medium">
              Playlists
            </Link>
            <Link to="/schedule" className="text-[#333333] hover:text-black font-medium">
              Calendar
            </Link>
            <Link to="/announcements" className="text-[#333333] hover:text-black font-medium">
              Announcements
            </Link>
            <Link to="/upload" className="text-[#333333] hover:text-black font-medium">
              Upload
            </Link>
            <Link to="/reports" className="text-[#333333] hover:text-black font-medium">
              Reports
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Button className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90 font-medium px-6">
              Yeni Yıldır
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavigation;