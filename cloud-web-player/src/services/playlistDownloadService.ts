import { Song } from "@/types/song";
import { toast } from "@/hooks/use-toast";
import { storageService } from "./storage/StorageService";
import { audioPlayerService } from "./audioPlayerService";

class PlaylistDownloadService {
  async downloadAndStoreSong(song: Song, baseUrl: string): Promise<void> {
    try {
      console.log(`Downloading song: ${song.name}`);
      
      const songUrl = `${baseUrl}/${song.filePath}`;
      const response = await fetch(songUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const buffer = await response.arrayBuffer();
      await storageService.storeSong(song._id, buffer);
      
      toast({
        title: "Başarılı",
        description: `${song.name} başarıyla indirildi`
      });

    } catch (error) {
      console.error(`Error downloading song ${song.name}:`, error);
      toast({
        variant: "destructive",
        title: "İndirme Hatası",
        description: `${song.name} indirilemedi: ${error.message}`
      });
      throw error;
    }
  }

  async storePlaylist(playlist: any): Promise<void> {
    try {
      console.log('Storing playlist locally:', playlist.name);
      
      toast({
        title: "İndirme Başladı",
        description: `${playlist.name} indiriliyor...`
      });

      // Her şarkıyı indir ve kaydet
      for (const song of playlist.songs) {
        await this.downloadAndStoreSong(song, playlist.baseUrl);
        
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