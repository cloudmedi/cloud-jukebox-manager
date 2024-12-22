import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { usePlaylistStore } from "@/store/playlistStore";

interface PlaylistData {
  name: string;
  description?: string;
}

export const usePlaylistMutations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addPlaylist, updatePlaylist: updateStorePlaylist } = usePlaylistStore();

  const createPlaylist = useMutation({
    mutationFn: async (data: PlaylistData) => {
      const response = await fetch("http://localhost:5000/api/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Playlist oluşturulamadı");
      return response.json();
    },
    onSuccess: (newPlaylist) => {
      // Optimistic update
      addPlaylist(newPlaylist);
      // Cache'i güncelle
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      toast({
        title: "Başarılı",
        description: "Playlist başarıyla oluşturuldu",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Playlist oluşturulurken bir hata oluştu",
      });
    },
  });

  const updatePlaylist = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PlaylistData }) => {
      const response = await fetch(`http://localhost:5000/api/playlists/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Playlist güncellenemedi");
      return response.json();
    },
    onSuccess: (updatedPlaylist) => {
      // Optimistic update
      updateStorePlaylist(updatedPlaylist._id, updatedPlaylist);
      // Cache'i güncelle
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      toast({
        title: "Başarılı",
        description: "Playlist başarıyla güncellendi",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Playlist güncellenirken bir hata oluştu",
      });
    },
  });

  return {
    createPlaylist,
    updatePlaylist,
  };
};