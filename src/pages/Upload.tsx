import { useState } from "react";
import { SongList } from "@/components/upload/SongList";
import SongUploader from "@/components/upload/SongUploader";
import { useQueryClient } from "@tanstack/react-query";

const Upload = () => {
  const queryClient = useQueryClient();

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["songs"] });
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
      <SongList />
    </div>
  );
};

export default Upload;