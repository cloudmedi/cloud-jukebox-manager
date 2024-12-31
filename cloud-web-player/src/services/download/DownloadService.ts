import { toast } from "@/hooks/use-toast";
import { storageService } from "../storage/StorageService";
import { Song } from "@/types/song";

class DownloadService {
  private async downloadFile(url: string, onProgress?: (progress: number) => void): Promise<ArrayBuffer> {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const contentLength = Number(response.headers.get('Content-Length')) || 0;
    let receivedLength = 0;
    const chunks: Uint8Array[] = [];

    if (!reader) {
      throw new Error('Response body is null');
    }

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      chunks.push(value);
      receivedLength += value.length;

      if (onProgress) {
        onProgress((receivedLength / contentLength) * 100);
      }
    }

    const allChunks = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
      allChunks.set(chunk, position);
      position += chunk.length;
    }

    return allChunks.buffer;
  }

  async downloadAndStoreSong(song: Song, baseUrl: string): Promise<void> {
    try {
      console.log(`Downloading song: ${song.name}`);
      
      toast({
        title: "İndiriliyor",
        description: `${song.name} indiriliyor...`
      });

      const songUrl = `${baseUrl}/${song.filePath}`;
      const buffer = await this.downloadFile(songUrl, (progress) => {
        console.log(`Download progress for ${song.name}: ${progress}%`);
      });

      await storageService.storeSong(song._id, buffer);
      
      toast({
        title: "Başarılı",
        description: `${song.name} başarıyla indirildi`
      });

      console.log(`Song downloaded and stored: ${song.name}`);
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
}

export const downloadService = new DownloadService();