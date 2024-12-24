const fs = require('fs');

class AnnouncementLogger {
  static logAnnouncementRequest(announcement) {
    console.log('\n=== ANONS ÇALMA İSTEĞİ ALINDI ===');
    console.log('Anons detayları:', {
      id: announcement._id,
      title: announcement.title,
      localPath: announcement.localPath,
      duration: announcement.duration
    });
  }

  static logFileCheck(path) {
    console.log('\n=== DOSYA KONTROLÜ ===');
    console.log('Kontrol edilen dosya yolu:', path);
    const exists = fs.existsSync(path);
    console.log(exists ? '✓ Dosya mevcut' : '❌ Dosya bulunamadı');
    return exists;
  }

  static logAudioState(audio) {
    console.log('\n=== AUDIO ELEMENT DURUMU ===');
    console.log({
      paused: audio.paused,
      currentTime: audio.currentTime,
      duration: audio.duration,
      volume: audio.volume,
      muted: audio.muted,
      readyState: audio.readyState,
      networkState: audio.networkState,
      error: audio.error,
      src: audio.src
    });
  }

  static logPlaybackStart() {
    console.log('\n=== ANONS ÇALMAYA BAŞLIYOR ===');
    console.log('Timestamp:', new Date().toISOString());
  }

  static logPlaybackProgress(currentTime) {
    console.log('\n▶️ Anons çalınıyor');
    console.log('Süre:', currentTime.toFixed(2));
  }

  static logPlaybackEnd() {
    console.log('\n=== ANONS TAMAMLANDI ===');
    console.log('Timestamp:', new Date().toISOString());
  }

  static logError(stage, error) {
    console.error(`\n❌ HATA: ${stage}`);
    console.error('Hata detayları:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }

  static logVolumeChange(oldVolume, newVolume) {
    console.log('\n=== SES SEVİYESİ DEĞİŞİMİ ===');
    console.log(`Eski seviye: ${oldVolume} -> Yeni seviye: ${newVolume}`);
  }
}

module.exports = AnnouncementLogger;