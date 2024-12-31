import { toast } from "@/hooks/use-toast";
import { Song } from "@/types/song";

class StorageService {
  private dbName = 'playlist_db';
  private dbVersion = 2; // Versiyonu artırıyoruz ki yeni schema uygulansın

  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      console.log('Opening database...');
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
        
        // Eski stores'ları temizle ve yeniden oluştur
        if (db.objectStoreNames.contains('songs')) {
          db.deleteObjectStore('songs');
        }
        if (db.objectStoreNames.contains('playlists')) {
          db.deleteObjectStore('playlists');
        }
        
        // Yeni stores'ları oluştur
        console.log('Creating songs store');
        db.createObjectStore('songs');
        
        console.log('Creating playlists store');
        const playlistStore = db.createObjectStore('playlists', { keyPath: '_id' });
        
        // Playlists store için indexler
        playlistStore.createIndex('name', 'name', { unique: false });
        
        console.log('Database schema updated successfully');
      };
    });
  }

  async storeSong(songId: string, songData: ArrayBuffer): Promise<void> {
    try {
      console.log(`Storing song: ${songId}`);
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

        transaction.oncomplete = () => {
          console.log(`Transaction completed for song: ${songId}`);
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

  async storePlaylist(playlist: any): Promise<void> {
    try {
      console.log(`Storing playlist: ${playlist.name}`);
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

        transaction.oncomplete = () => {
          console.log(`Transaction completed for playlist: ${playlist.name}`);
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

  async getSong(songId: string): Promise<ArrayBuffer | null> {
    try {
      console.log(`Getting song: ${songId}`);
      const db = await this.openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['songs'], 'readonly');
        const store = transaction.objectStore('songs');
        const request = store.get(songId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          console.log(`Song retrieved successfully: ${songId}`);
          resolve(request.result);
        };
      });
    } catch (error) {
      console.error('Error getting song:', error);
      return null;
    }
  }

  async getPlaylist(playlistId: string): Promise<any> {
    try {
      console.log(`Getting playlist: ${playlistId}`);
      const db = await this.openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['playlists'], 'readonly');
        const store = transaction.objectStore('playlists');
        const request = store.get(playlistId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          console.log(`Playlist retrieved successfully: ${playlistId}`);
          resolve(request.result);
        };
      });
    } catch (error) {
      console.error('Error getting playlist:', error);
      return null;
    }
  }

  async deleteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Deleting database...');
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