import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlaylistForm } from "@/components/playlists/PlaylistForm";

const NewPlaylist = () => {
  const navigate = useNavigate();

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/playlists")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          Yeni Playlist Oluştur
        </h1>
      </div>

      <PlaylistForm onSuccess={() => navigate("/playlists")} />
    </div>
  );
};

export default NewPlaylist;