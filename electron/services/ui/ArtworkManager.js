const path = require('path');
const { ipcRenderer } = require('electron');

class ArtworkManager {
    static getArtworkUrl(artwork, playlistId = null) {
        if (!artwork) return null;
        
        // Artwork URL'i http ile başlıyorsa direkt kullan
        if (artwork.startsWith('http')) {
            return artwork;
        }
        
        // Uploads klasöründen gelen artworkler için base URL ekle
        if (artwork.startsWith('/uploads')) {
            return `http://localhost:5000${artwork}`;
        }
        
        // Local dosya sistemindeki artworkler için file:// protokolü kullan
        if (path.isAbsolute(artwork)) {
            return `file://${artwork}`;
        }
        
        // Relative path ise downloads/artwork klasörüne göre yol oluştur
        const userDataPath = process.env.APPDATA;
        const artworkPath = playlistId 
            ? path.join(userDataPath, 'cloud-media-player', 'downloads', playlistId, 'artwork', 'artwork.jpg')
            : path.join(userDataPath, 'cloud-media-player', 'downloads', 'artwork', 'artwork.jpg');
        return `file://${artworkPath}`;
    }

    static createArtworkHtml(artwork, name, playlistId = null) {
        const artworkUrl = this.getArtworkUrl(artwork, playlistId);
        return artworkUrl 
            ? `<img src="${artworkUrl}" alt="${name}" class="playlist-artwork" onerror="this.onerror=null; this.src=''; console.error('Artwork yükleme hatası:', this.src);"/>`
            : '<div class="playlist-artwork-placeholder"></div>';
    }

    static async loadArtwork(artworkPath, playlistId) {
        if (!artworkPath || !playlistId) return;
        
        try {
            // Artwork URL'ini oluştur
            const artworkUrl = this.getArtworkUrl(artworkPath);
            if (!artworkUrl) return;

            // HTTP URL'i ise önce dosyayı indir
            if (artworkUrl.startsWith('http')) {
                const localPath = await this.downloadArtwork(artworkUrl, playlistId);
                if (localPath) {
                    artworkPath = localPath;
                }
            }

            // Artwork'ü önceden yükle
            const img = new Image();
            img.onerror = () => {
                console.error('Error loading artwork:', artworkUrl);
                img.onerror = null;
                img.src = '';
            };
            img.src = this.getArtworkUrl(artworkPath, playlistId);
        } catch (error) {
            console.error('Error in loadArtwork:', error);
        }
    }

    static async downloadArtwork(url, playlistId) {
        try {
            // Artwork'ü indir
            const response = await fetch(url);
            const blob = await response.blob();
            
            // Playlist/artwork klasörüne kaydet
            const userDataPath = process.env.APPDATA;
            const artworkPath = path.join(userDataPath, 'cloud-media-player', 'downloads', playlistId, 'artwork', 'artwork.jpg');
            
            // Dosyayı kaydet
            const buffer = await blob.arrayBuffer();
            await ipcRenderer.invoke('save-artwork', {
                path: artworkPath,
                buffer: buffer
            });

            return artworkPath;
        } catch (error) {
            console.error('Error downloading artwork:', error);
            return null;
        }
    }
}

module.exports = ArtworkManager;