class PlaylistUIService {
  static createPlaylistElement(playlist) {
    const playlistElement = document.createElement('div');
    playlistElement.className = 'playlist-item';
    
    // Sadece playlist artwork'ünü göster
    const artworkHtml = playlist.artwork ? 
      `<img src="${playlist.artwork}" alt="${playlist.name}" class="playlist-artwork"/>` :
      '<div class="playlist-artwork-placeholder"></div>';
    
    // Şarkı listesini oluştur
    const songsHtml = playlist.songs.map(song => `
      <div class="song-item">
        <span class="song-name">${song.name || 'Unknown Song'}</span>
        <span class="song-artist">${song.artist || 'Unknown Artist'}</span>
      </div>
    `).join('');
    
    playlistElement.innerHTML = `
      <div class="playlist-info">
        <div class="artwork-container">
          ${artworkHtml}
        </div>
        <div class="playlist-details">
          <h3 class="playlist-name">${playlist.name}</h3>
          <div class="songs-container">
            ${songsHtml}
          </div>
        </div>
      </div>
    `;
    
    return playlistElement;
  }
}

module.exports = PlaylistUIService;