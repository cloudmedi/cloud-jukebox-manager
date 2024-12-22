import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const playlists = [
  { id: 1, title: "Top Hits", songCount: 25, image: "/placeholder.svg" },
  { id: 2, title: "Chill Vibes", songCount: 18, image: "/placeholder.svg" },
  { id: 3, title: "Energy Mix", songCount: 30, image: "/placeholder.svg" },
  // Add more playlists as needed
];

const Index = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Playlists</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className="group relative overflow-hidden rounded-md bg-muted/50 p-4 transition-all hover:bg-muted"
          >
            <div className="relative aspect-square overflow-hidden rounded-md">
              <img
                src={playlist.image}
                alt={playlist.title}
                className="object-cover transition-all group-hover:scale-105"
              />
              <Button
                size="icon"
                className="absolute bottom-4 right-4 h-12 w-12 rounded-full opacity-0 transition-all group-hover:opacity-100"
              >
                <Play className="h-6 w-6" />
              </Button>
            </div>
            <div className="mt-4">
              <h3 className="font-semibold">{playlist.title}</h3>
              <p className="text-sm text-muted-foreground">
                {playlist.songCount} songs
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Index;