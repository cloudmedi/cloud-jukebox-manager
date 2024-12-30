class ArtworkManager {
  static getArtworkUrl(artwork) {
    if (!artwork) {
      console.log('Artwork yok, placeholder gösteriliyor');
      return null;
    }

    // Artwork path'i zaten tam URL içeriyorsa direkt döndür
    if (artwork.startsWith('http')) {
      return artwork;
    }

    // Local path'i URL'e çevir
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const artworkUrl = `${baseUrl}${artwork}`;
    console.log('Artwork URL oluşturuldu:', artworkUrl);
    return artworkUrl;
  }

  static createArtworkHtml(artwork, name) {
    const artworkUrl = this.getArtworkUrl(artwork);
    
    if (!artworkUrl) {
      console.log('Artwork URL bulunamadı, placeholder gösteriliyor');
      return '<div class="playlist-artwork-placeholder"></div>';
    }

    return `
      <img 
        src="${artworkUrl}" 
        alt="${name}" 
        class="playlist-artwork" 
        onerror="(function(img) {
          console.error('Artwork yükleme hatası:', img.src);
          img.onerror = null;
          img.parentNode.innerHTML = '<div class=\'playlist-artwork-placeholder\'></div>';
        })(this)"
      />
    `;
  }
}

module.exports = ArtworkManager;