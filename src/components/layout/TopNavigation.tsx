import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TopNavigation = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-2xl font-bold text-[#FFD60A]">
              veeq
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-[#333333] hover:text-black font-medium">
              Home
            </Link>
            <Link to="/campaigns" className="text-[#333333] hover:text-black font-medium">
              Campaigns
            </Link>
            <Link to="/devices" className="text-[#333333] hover:text-black font-medium">
              Device
            </Link>
            <Link to="/calendar" className="text-[#333333] hover:text-black font-medium">
              Calendar
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Button className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90 font-medium px-6">
              New Yıldır
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavigation;