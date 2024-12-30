class ArtworkManager {
  static getArtworkUrl(artwork) {
    if (!artwork) return null;
    return `http://localhost:5000${artwork}`;
  }

  static createArtworkHtml(artwork, name) {
    const artworkUrl = this.getArtworkUrl(artwork);
    return artworkUrl 
      ? `<img src="${artworkUrl}" alt="${name}" class="playlist-artwork" onerror="console.error('Artwork yükleme hatası:', this.src)"/>`
      : '<div class="playlist-artwork-placeholder"></div>';
  }
}

module.exports = ArtworkManager;