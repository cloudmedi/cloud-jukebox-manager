import { useState } from "react";
import { SongList } from "@/components/upload/SongList";
import SongUploader from "@/components/upload/SongUploader";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Song } from "@/types/song";

const Upload = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: songs = [] } = useQuery<Song[]>({
    queryKey: ["songs"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/songs");
      if (!response.ok) throw new Error("Failed to fetch songs");
      return response.json();
    },
  });

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["songs"] });
  };

  const handleDelete = async (songId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/songs/${songId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete song");
      }

      queryClient.invalidateQueries({ queryKey: ["songs"] });
      toast({
        title: "Başarılı",
        description: "Şarkı başarıyla silindi",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Şarkı silinirken bir hata oluştu",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Şarkı Yönetimi</h2>
        <p className="text-muted-foreground">
          Şarkılarınızı yükleyin ve yönetin
        </p>
      </div>

      <SongUploader onUploadComplete={handleUploadComplete} />
      <SongList songs={songs} onDelete={handleDelete} />
    </div>
  );
};

export default Upload;