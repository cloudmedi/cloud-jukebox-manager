import { toast } from "@/hooks/use-toast";
import { storageService } from "./storage/StorageService";
import { audioPlayerService } from "./audioPlayerService";
import { Song } from "@/types/song";

class PlaylistDownloadService {
  async downloadAndStoreSong(song: Song, baseUrl: string): Promise<void> {
    try {
      console.log('PlaylistDownloadService: Downloading song:', {
        songId: song._id,
        songName: song.name,
        baseUrl
      });
      
      const songUrl = `${baseUrl}/${song.filePath}`;
      const response = await fetch(songUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const buffer = await response.arrayBuffer();
      console.log('PlaylistDownloadService: Song downloaded, storing in IndexedDB');
      
      await storageService.storeSong(song._id, buffer);
      console.log('PlaylistDownloadService: Song stored successfully');
      
      toast({
        title: "Başarılı",
        description: `${song.name} başarıyla indirildi`
      });
    } catch (error) {
      console.error('PlaylistDownloadService: Error downloading song:', error);
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
      console.log('PlaylistDownloadService: Storing playlist:', {
        playlistId: playlist._id,
        playlistName: playlist.name,
        songCount: playlist.songs?.length
      });
      
      toast({
        title: "İndirme Başladı",
        description: `${playlist.name} indiriliyor...`
      });

      for (const song of playlist.songs) {
        console.log('PlaylistDownloadService: Processing song:', song.name);
        await this.downloadAndStoreSong(song, playlist.baseUrl);
        
        song.originalFilePath = song.filePath;
        song.filePath = `indexeddb://${song._id}`;
        song.isLocal = true;
      }
      
      console.log('PlaylistDownloadService: All songs downloaded, storing playlist');
      await storageService.storePlaylist(playlist);
      
      toast({
        title: "Playlist Hazır",
        description: `${playlist.name} başarıyla indirildi`
      });

      console.log('PlaylistDownloadService: Loading playlist in audio player');
      await audioPlayerService.loadPlaylist(playlist);

    } catch (error) {
      console.error('PlaylistDownloadService: Error storing playlist:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Playlist kaydedilemedi"
      });
      throw error;
    }
  }

  async getPlaylist(playlistId: string): Promise<any> {
    console.log('PlaylistDownloadService: Getting playlist:', playlistId);
    const playlist = await storageService.getPlaylist(playlistId);
    
    if (playlist) {
      console.log('PlaylistDownloadService: Found playlist:', {
        playlistId: playlist._id,
        songCount: playlist.songs?.length
      });
    } else {
      console.log('PlaylistDownloadService: Playlist not found:', playlistId);
    }
    
    return playlist;
  }

  async getSong(songId: string): Promise<ArrayBuffer | null> {
    console.log('PlaylistDownloadService: Getting song:', songId);
    const songData = await storageService.getSong(songId);
    
    if (songData) {
      console.log('PlaylistDownloadService: Found song data');
    } else {
      console.log('PlaylistDownloadService: Song not found:', songId);
    }
    
    return songData;
  }
}

export const playlistDownloadService = new PlaylistDownloadService();