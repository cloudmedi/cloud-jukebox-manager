import { useQuery } from "@tanstack/react-query";
import { usePlaylistStore } from "@/store/playlistStore";

export const usePlaylistQueries = () => {
  const { setPlaylists, setError } = usePlaylistStore();

  const playlists = useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/playlists");
      if (!response.ok) throw new Error("Playlistler yüklenemedi");
      const data = await response.json();
      setPlaylists(data);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 30, // 30 dakika (eski cacheTime)
    retry: 3,
    onError: (error) => {
      setError(error as Error);
    },
  });

  const playlist = (id: string) =>
    useQuery({
      queryKey: ["playlist", id],
      queryFn: async () => {
        const response = await fetch(`http://localhost:5000/api/playlists/${id}`);
        if (!response.ok) throw new Error("Playlist yüklenemedi");
        return response.json();
      },
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    });

  return {
    playlists,
    playlist,
  };
};