import { Song } from "@/types/song";

class PlaylistDownloadService {
  private async downloadFile(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.arrayBuffer();
  }

  private async storeFile(buffer: ArrayBuffer, filename: string): Promise<void> {
    // IndexedDB'ye kaydet
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
      };
    });
  }

  async downloadAndStoreSong(song: Song, baseUrl: string): Promise<void> {
    try {
      console.log(`Downloading song: ${song.name}`);
      
      // Şarkı URL'ini oluştur
      const songUrl = `${baseUrl}/${song.filePath}`;
      
      // Şarkıyı indir
      const buffer = await this.downloadFile(songUrl);
      
      // Şarkıyı lokale kaydet
      await this.storeFile(buffer, song._id);
      
      console.log(`Successfully downloaded and stored song: ${song.name}`);
    } catch (error) {
      console.error(`Error downloading song ${song.name}:`, error);
      throw error;
    }
  }

  async getSong(songId: string): Promise<ArrayBuffer | null> {
    const db = await this.openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['songs'], 'readonly');
      const store = transaction.objectStore('songs');
      const request = store.get(songId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

export const playlistDownloadService = new PlaylistDownloadService();