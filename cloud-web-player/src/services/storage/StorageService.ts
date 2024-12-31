import { toast } from "@/hooks/use-toast";
import { Song } from "@/types/song";

class StorageService {
  private dbName = 'playlist_db';
  private dbVersion = 1;

  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Database error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('Database opened successfully');
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        console.log('Database upgrade needed, creating stores...');
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create songs store if it doesn't exist
        if (!db.objectStoreNames.contains('songs')) {
          console.log('Creating songs store');
          db.createObjectStore('songs');
        }
        
        // Create playlists store if it doesn't exist
        if (!db.objectStoreNames.contains('playlists')) {
          console.log('Creating playlists store');
          db.createObjectStore('playlists', { keyPath: '_id' });
        }
      };
    });
  }

  async storeSong(songId: string, songData: ArrayBuffer): Promise<void> {
    try {
      const db = await this.openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['songs'], 'readwrite');
        const store = transaction.objectStore('songs');
        const request = store.put(songData, songId);

        request.onerror = () => {
          console.error('Error storing song:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          console.log(`Song stored successfully: ${songId}`);
          resolve();
        };
      });
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
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['playlists'], 'readwrite');
        const store = transaction.objectStore('playlists');
        const request = store.put(playlist);

        request.onerror = () => {
          console.error('Error storing playlist:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          console.log(`Playlist stored successfully: ${playlist.name}`);
          resolve();
        };
      });
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

  async deleteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);
      
      request.onerror = () => {
        console.error('Error deleting database:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        console.log('Database deleted successfully');
        resolve();
      };
    });
  }
}

export const storageService = new StorageService();