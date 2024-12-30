const EmergencyStateHandler = require('../emergency/EmergencyStateHandler');
const PlaylistInitializer = require('./PlaylistInitializer');

class AutoPlayManager {
  handleAutoPlay(event, playlist, audioPlayer) {
    console.log('Auto-playing playlist:', playlist);
    
    // Emergency durumu kontrolü
    if (EmergencyStateHandler.isEmergencyActive()) {
      console.log('Auto-play blocked: Emergency state is active');
      return;
    }

    if (playlist && playlist.songs && playlist.songs.length > 0) {
      const shouldAutoPlay = true; // Bu değer store'dan alınabilir
      
      // Playlist'i başlat ve karıştır
      const initializedPlaylist = PlaylistInitializer.initializePlaylist(playlist);
      
      if (initializedPlaylist) {
        if (shouldAutoPlay && !EmergencyStateHandler.isEmergencyActive()) {
          console.log('Auto-playing with initialized playlist');
          event.sender.send('play-playlist', initializedPlaylist.playlist);
        } else {
          console.log('Loading initialized playlist without auto-play');
          event.sender.send('load-playlist', initializedPlaylist.playlist);
        }
      }
    }
  }
}

module.exports = new AutoPlayManager();