export const playlistDownloadService = {
  async downloadAndStoreSong(song: any, baseUrl: string) {
    try {
      console.log('Downloading song:', song.name);
      const response = await fetch(`${baseUrl}/${song.filePath}`);
      const blob = await response.blob();
      
      // IndexedDB'ye kaydet
      const db = await this.openDatabase();
      const transaction = db.transaction(['songs'], 'readwrite');
      const store = transaction.objectStore('songs');
      
      const songData = {
        id: song._id,
        name: song.name,
        artist: song.artist,
        blob: blob,
        localPath: URL.createObjectURL(blob)
      };
      
      await store.put(songData);
      console.log('Song saved:', song.name);
      
      return songData.localPath;
    } catch (error) {
      console.error('Error downloading song:', error);
      throw error;
    }
  },

  async openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('musicDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('songs')) {
          db.createObjectStore('songs', { keyPath: 'id' });
        }
      };
    });
  }
};