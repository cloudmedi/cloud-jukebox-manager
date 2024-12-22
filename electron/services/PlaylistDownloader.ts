import { downloadFile, createFullUrl } from './utils/downloadUtils';
import path from 'path';
import { app } from 'electron';
import Store from 'electron-store';

export class PlaylistDownloader {
  private store: Store;
  private downloadPath: string;

  constructor() {
    this.store = new Store();
    this.downloadPath = path.join(app.getPath('userData'), 'downloads');
  }

  async downloadSong(
    song: any, 
    playlistPath: string, 
    baseUrl: string,
    onProgress?: (progress: number) => void
  ) {
    const songPath = path.join(playlistPath, `${song._id}.mp3`);
    
    try {
      const fullUrl = createFullUrl(baseUrl, song.filePath);
      console.log('Downloading song from URL:', fullUrl);
      
      await downloadFile(fullUrl, songPath, onProgress);
      
      this.store.set(`download.${song._id}`, {
        status: 'completed',
        path: songPath
      });

      return { success: true, path: songPath };
    } catch (error) {
      console.error(`Şarkı indirme hatası (${song.name}):`, error);
      this.store.set(`download.${song._id}`, {
        status: 'error',
        error: error.message
      });

      return { success: false, error: error.message };
    }
  }

  async downloadPlaylist(playlist: any, ws: WebSocket) {
    console.log('Playlist indirme başlatılıyor:', playlist._id);
    
    const playlistPath = path.join(this.downloadPath, playlist._id);
    
    try {
      // İndirme durumunu kaydet
      this.store.set(`download.${playlist._id}`, {
        status: 'downloading',
        progress: 0,
        completedSongs: []
      });

      // Şarkıları sırayla indir
      for (let i = 0; i < playlist.songs.length; i++) {
        const song = playlist.songs[i];
        console.log(`Şarkı indiriliyor (${i + 1}/${playlist.songs.length}):`, song.name);
        
        const result = await this.downloadSong(
          song, 
          playlistPath, 
          playlist.baseUrl,
          (progress) => {
            ws.send(JSON.stringify({
              type: 'downloadProgress',
              songId: song._id,
              progress
            }));
          }
        );
        
        if (result.success) {
          // Başarılı indirmeleri kaydet
          const downloadState = this.store.get(`download.${playlist._id}`);
          downloadState.completedSongs.push(song._id);
          this.store.set(`download.${playlist._id}`, downloadState);
        }

        // İlerleme durumunu gönder
        ws.send(JSON.stringify({
          type: 'downloadProgress',
          playlistId: playlist._id,
          songId: song._id,
          progress: Math.round(((i + 1) / playlist.songs.length) * 100)
        }));
      }

      // İndirme durumunu güncelle
      this.store.set(`download.${playlist._id}`, {
        status: 'completed',
        progress: 100,
        completedSongs: playlist.songs.map(s => s._id)
      });

      return true;
    } catch (error) {
      console.error('Playlist indirme hatası:', error);
      throw error;
    }
  }
}