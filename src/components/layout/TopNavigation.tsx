import { Link } from "react-router-dom";
import { Home, Speaker, List, Calendar, Volume2, Upload, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const TopNavigation = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Cloud Media</h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <Home className="h-4 w-4" />
              <span>Ana Sayfa</span>
            </Link>
            <Link to="/devices" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <Speaker className="h-4 w-4" />
              <span>Cihaz Yönetimi</span>
            </Link>
            <Link to="/playlists" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <List className="h-4 w-4" />
              <span>Playlist Yönetimi</span>
            </Link>
            <Link to="/schedule" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <Calendar className="h-4 w-4" />
              <span>Zamanlama</span>
            </Link>
            <Link to="/announcements" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <Volume2 className="h-4 w-4" />
              <span>Anons Yönetimi</span>
            </Link>
            <Link to="/upload" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <Upload className="h-4 w-4" />
              <span>Music Upload</span>
            </Link>
            <Link to="/reports" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <BarChart2 className="h-4 w-4" />
              <span>Raporlama</span>
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="outline">Giriş Yap</Button>
            <Button className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90">Yeni Yıldır</Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavigation;