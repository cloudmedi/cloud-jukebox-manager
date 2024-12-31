import { Song } from "@/types/song";
import { toast } from "@/hooks/use-toast";

class PlaylistDownloadService {
  private async downloadFile(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.arrayBuffer();
  }

  private async storeFile(buffer: ArrayBuffer, filename: string): Promise<void> {
    const db = await this.openDatabase();
    const transaction = db.transaction(['songs'], 'readwrite');
    const store = transaction.objectStore('songs');
    await store.put(buffer, filename);
  }

  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('playlist_db', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('songs')) {
          db.createObjectStore('songs');
        }
        if (!db.objectStoreNames.contains('playlists')) {
          db.createObjectStore('playlists');
        }
      };
    });
  }

  async downloadAndStoreSong(song: Song, baseUrl: string): Promise<void> {
    try {
      console.log(`Downloading song: ${song.name}`);
      
      const songUrl = `${baseUrl}/${song.filePath}`;
      const buffer = await this.downloadFile(songUrl);
      await this.storeFile(buffer, song._id);
      
      console.log(`Successfully downloaded and stored song: ${song.name}`);
    } catch (error) {
      console.error(`Error downloading song ${song.name}:`, error);
      throw error;
    }
  }

  async storePlaylist(playlist: any): Promise<void> {
    try {
      console.log('Storing playlist locally:', playlist.name);
      
      const db = await this.openDatabase();
      const transaction = db.transaction(['playlists'], 'readwrite');
      const store = transaction.objectStore('playlists');
      
      // Her şarkı için local flag'i ekle ve filePath'i güncelle
      const localPlaylist = {
        ...playlist,
        songs: playlist.songs.map((song: Song) => ({
          ...song,
          isLocal: true,
          originalFilePath: song.filePath,
          filePath: `indexeddb://${song._id}` // Local referans için özel URL şeması
        }))
      };
      
      await store.put(localPlaylist, playlist._id);
      console.log(`Playlist stored locally: ${playlist.name}`);
      
      // Playlist'i otomatik oynatmak için audioPlayerService'i çağır
      const audioPlayerService = (await import('./audioPlayerService')).audioPlayerService;
      await audioPlayerService.loadPlaylist(localPlaylist);
      
      toast({
        title: "Playlist Hazır",
        description: `${playlist.name} yerel depolamaya kaydedildi ve oynatılıyor`
      });
    } catch (error) {
      console.error('Error storing playlist:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Playlist kaydedilirken bir hata oluştu"
      });
      throw error;
    }
  }

  async getPlaylist(playlistId: string): Promise<any> {
    try {
      console.log('Getting playlist from local storage:', playlistId);
      const db = await this.openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['playlists'], 'readonly');
        const store = transaction.objectStore('playlists');
        const request = store.get(playlistId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const playlist = request.result;
          console.log('Retrieved playlist from local storage:', playlist?.name);
          resolve(playlist);
        };
      });
    } catch (error) {
      console.error('Error getting playlist:', error);
      return null;
    }
  }

  async getSong(songId: string): Promise<ArrayBuffer | null> {
    try {
      console.log('Getting song from local storage:', songId);
      const db = await this.openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['songs'], 'readonly');
        const store = transaction.objectStore('songs');
        const request = store.get(songId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          console.log('Retrieved song from local storage:', songId);
          resolve(request.result);
        };
      });
    } catch (error) {
      console.error('Error getting song:', error);
      return null;
    }
  }
}

export const playlistDownloadService = new PlaylistDownloadService();