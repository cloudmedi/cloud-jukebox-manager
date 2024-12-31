import { toast } from "@/hooks/use-toast";
import { Song } from "@/types/song";

class StorageService {
  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('playlist_db', 1);

      request.onerror = () => {
        console.error('Database error:', request.error);
        reject(request.error);
      };

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

  async storeSong(songId: string, songData: ArrayBuffer): Promise<void> {
    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(['songs'], 'readwrite');
      const store = transaction.objectStore('songs');
      await store.put(songData, songId);
      
      console.log(`Song stored successfully: ${songId}`);
    } catch (error) {
      console.error('Error storing song:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Şarkı kaydedilemedi"
      });
      throw error;
    }
  }

  async getSong(songId: string): Promise<ArrayBuffer | null> {
    try {
      const db = await this.openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['songs'], 'readonly');
        const store = transaction.objectStore('songs');
        const request = store.get(songId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    } catch (error) {
      console.error('Error retrieving song:', error);
      return null;
    }
  }

  async storePlaylist(playlist: any): Promise<void> {
    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(['playlists'], 'readwrite');
      const store = transaction.objectStore('playlists');
      await store.put(playlist, playlist._id);
      
      console.log(`Playlist stored successfully: ${playlist.name}`);
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
    try {
      const db = await this.openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['playlists'], 'readonly');
        const store = transaction.objectStore('playlists');
        const request = store.get(playlistId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    } catch (error) {
      console.error('Error retrieving playlist:', error);
      return null;
    }
  }
}

export const storageService = new StorageService();