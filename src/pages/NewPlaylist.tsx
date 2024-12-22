import { PlaylistForm } from "@/components/playlists/PlaylistForm";
import { useNavigate } from "react-router-dom";

const NewPlaylist = () => {
  const navigate = useNavigate();

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Yeni Playlist Oluştur</h1>
      </div>
      
      <PlaylistForm onSuccess={() => navigate("/playlists")} />
    </div>
  );
};

export default NewPlaylist;