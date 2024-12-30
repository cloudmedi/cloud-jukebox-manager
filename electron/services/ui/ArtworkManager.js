class ArtworkManager {
  static getArtworkUrl(artwork) {
    if (!artwork) return null;
    
    // URL'i düzelt: /uploads/playlist-xxx -> /uploads/playlists/playlist-xxx
    const correctedPath = artwork.replace('/uploads/playlist-', '/uploads/playlists/playlist-');
    return `http://localhost:5000${correctedPath}`;
  }

  static createArtworkHtml(artwork, name) {
    const artworkUrl = this.getArtworkUrl(artwork);
    return artworkUrl 
      ? `<img src="${artworkUrl}" alt="${name}" class="playlist-artwork" onerror="console.error('Artwork yükleme hatası:', this.src)"/>`
      : '<div class="playlist-artwork-placeholder"></div>';
  }
}

module.exports = ArtworkManager;