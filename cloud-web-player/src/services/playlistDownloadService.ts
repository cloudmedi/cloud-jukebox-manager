import { Song } from "@/types/song";
import { toast } from "@/hooks/use-toast";
import { storageService } from "./storage/StorageService";
import { downloadService } from "./download/DownloadService";
import { audioPlayerService } from "./audioPlayerService";

class PlaylistDownloadService {
  async storePlaylist(playlist: any): Promise<void> {
    try {
      console.log('Storing playlist locally:', playlist.name);
      
      toast({
        title: "İndirme Başladı",
        description: `${playlist.name} indiriliyor...`
      });

      // Her şarkıyı indir ve kaydet
      for (const song of playlist.songs) {
        await downloadService.downloadAndStoreSong(song, playlist.baseUrl);
        
        // Şarkı yolunu güncelle
        song.originalFilePath = song.filePath;
        song.filePath = `indexeddb://${song._id}`;
        song.isLocal = true;
      }
      
      // Güncellenmiş playlist'i kaydet
      await storageService.storePlaylist(playlist);
      
      toast({
        title: "Playlist Hazır",
        description: `${playlist.name} başarıyla indirildi`
      });

      // Playlist'i otomatik olarak yükle ve çal
      await audioPlayerService.loadPlaylist(playlist);

    } catch (error) {
      console.error('Error storing playlist:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Playlist kaydedilemedi"
      });
      throw error;
    }
  }

  async getPlaylist(playlistId: string): Promise<any> {
    return await storageService.getPlaylist(playlistId);
  }

  async getSong(songId: string): Promise<ArrayBuffer | null> {
    return await storageService.getSong(songId);
  }
}

export const playlistDownloadService = new PlaylistDownloadService();