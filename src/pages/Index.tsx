import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Music2, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PlaylistCard } from "@/components/playlists/PlaylistCard";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: playlists, isLoading } = useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/playlists");
      if (!response.ok) {
        throw new Error("Playlist verileri alınamadı");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#A3292E] to-[#C1444A] text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h3 className="text-sm font-medium opacity-80">Sunny Chill House</h3>
              <h1 className="text-6xl font-bold leading-tight">Chill Beats</h1>
              <p className="text-xl opacity-90 max-w-xl">
                Feel the groove with tracks like "Conquer the Storm," "My Side," and "Magic Ride". Let the soothing beats from CMD Beat Zone take you on a journey through laid-back melodies and chill vibes, perfect for any relaxing moment.
              </p>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden">
                <img 
                  src="/lovable-uploads/fe649b94-1f05-46ff-9886-50b8a0cec0ea.png" 
                  alt="Sunny Chill House" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,0 C320,80 640,120 960,120 C1280,120 1440,80 1440,0 L1440,120 L0,120 Z" fill="white"/>
          </svg>
        </div>
      </div>

      <div className="container mx-auto px-4 space-y-12">
        {/* Search Bar */}
        <div className="max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              type="search" 
              placeholder="Search..." 
              className="pl-12 h-14 rounded-full border-gray-200 focus:border-gray-300 focus:ring-0"
            />
          </div>
        </div>

        {/* Cafe Channel Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cafe Channel</h2>
            <p className="text-gray-500">Time to get jazzy</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {playlists.slice(0, 6).map((playlist) => (
              <PlaylistCard
                key={playlist._id}
                playlist={playlist}
                onDelete={(id) => {
                  toast({
                    title: "Playlist silindi",
                    description: "Playlist başarıyla silindi.",
                  });
                }}
                onEdit={(id) => navigate(`/playlists/${id}/edit`)}
                onPlay={(id) => {
                  const mainLayout = document.querySelector('.main-layout');
                  if (mainLayout) {
                    mainLayout.setAttribute('data-player-visible', 'true');
                  }
                }}
              />
            ))}
          </div>
        </div>

        {/* Popular Today Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Popular Today</h2>
            <p className="text-gray-500">Most streamed in cafes</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {playlists.slice(0, 6).map((playlist) => (
              <PlaylistCard
                key={playlist._id}
                playlist={playlist}
                onDelete={(id) => {
                  toast({
                    title: "Playlist silindi",
                    description: "Playlist başarıyla silindi.",
                  });
                }}
                onEdit={(id) => navigate(`/playlists/${id}/edit`)}
                onPlay={(id) => {
                  const mainLayout = document.querySelector('.main-layout');
                  if (mainLayout) {
                    mainLayout.setAttribute('data-player-visible', 'true');
                  }
                }}
              />
            ))}
          </div>
        </div>

        {/* Second Cafe Channel Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cafe Channel</h2>
            <p className="text-gray-500">Time to get jazzy</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {playlists.slice(0, 6).map((playlist) => (
              <PlaylistCard
                key={playlist._id}
                playlist={playlist}
                onDelete={(id) => {
                  toast({
                    title: "Playlist silindi",
                    description: "Playlist başarıyla silindi.",
                  });
                }}
                onEdit={(id) => navigate(`/playlists/${id}/edit`)}
                onPlay={(id) => {
                  const mainLayout = document.querySelector('.main-layout');
                  if (mainLayout) {
                    mainLayout.setAttribute('data-player-visible', 'true');
                  }
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;