import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaybackTable } from "./device-playback/PlaybackTable";

const Playlists = () => {
  const { data: playlists, isLoading } = useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/playlists");
      if (!response.ok) throw new Error("Playlists yüklenemedi");
      return response.json();
    },
  });

  return (
    <>
      <h1>Playlist Yönetimi</h1>
      <div className="space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Playlists</CardTitle>
            </CardHeader>
            <CardContent>
              <PlaybackTable data={playlists} />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default Playlists;
