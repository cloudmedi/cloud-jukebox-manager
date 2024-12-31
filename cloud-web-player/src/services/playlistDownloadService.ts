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
      const db = await this.openDatabase();
      const transaction = db.transaction(['playlists'], 'readwrite');
      const store = transaction.objectStore('playlists');
      
      // Her şarkı için local flag'i ekle
      const localPlaylist = {
        ...playlist,
        songs: playlist.songs.map((song: Song) => ({
          ...song,
          isLocal: true
        }))
      };
      
      await store.put(localPlaylist, playlist._id);
      console.log(`Playlist stored locally: ${playlist.name}`);
    } catch (error) {
      console.error('Error storing playlist:', error);
      throw error;
    }
  }

  async getPlaylist(playlistId: string): Promise<any> {
    const db = await this.openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['playlists'], 'readonly');
      const store = transaction.objectStore('playlists');
      const request = store.get(playlistId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
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