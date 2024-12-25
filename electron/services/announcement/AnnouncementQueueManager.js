class AnnouncementQueueManager {
  constructor() {
    this.currentAnnouncement = null;
    this.queue = [];
    this.isProcessing = false;
    this.wasPlaylistPlaying = false;
  }

  addAnnouncement(announcement, priority) {
    console.log(`Adding announcement to queue: ${announcement._id}, priority: ${priority}`);
    
    // Eğer aynı anons zaten çalıyorsa, ekleme
    if (this.currentAnnouncement && this.currentAnnouncement._id === announcement._id) {
      console.log('This announcement is already playing');
      return false;
    }

    // Eğer aynı anons kuyruktaysa, ekleme
    if (this.queue.some(item => item.announcement._id === announcement._id)) {
      console.log('This announcement is already in queue');
      return false;
    }

    this.queue.push({
      announcement,
      priority, // 1: dakika bazlı, 2: şarkı bazlı
      timestamp: Date.now()
    });

    // Önceliğe göre sırala
    this.queue.sort((a, b) => a.priority - b.priority);
    
    return true;
  }

  async processQueue(playlistAudio, campaignAudio) {
    if (this.isProcessing || this.queue.length === 0) return;

    try {
      this.isProcessing = true;
      const nextItem = this.queue.shift();
      
      // Eğer başka bir anons çalıyorsa ve önceliği daha yüksekse
      if (this.currentAnnouncement) {
        const currentPriority = this.getCurrentAnnouncementPriority();
        if (currentPriority <= nextItem.priority) {
          console.log('Current announcement has higher or equal priority, queuing new announcement');
          this.queue.unshift(nextItem);
          this.isProcessing = false;
          return;
        }
      }

      // Playlist durumunu kaydet
      this.wasPlaylistPlaying = !playlistAudio.paused;
      
      // Eğer playlist çalıyorsa duraklat
      if (this.wasPlaylistPlaying) {
        console.log('Pausing playlist before announcement');
        playlistAudio.pause();
        // Playlist'in tamamen durması için bekle
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.currentAnnouncement = nextItem.announcement;
      
      // Anonsu çal
      console.log(`Playing announcement: ${this.currentAnnouncement._id}`);
      campaignAudio.src = this.currentAnnouncement.localPath;
      await campaignAudio.play();

    } catch (error) {
      console.error('Error processing announcement queue:', error);
      this.cleanup();
    }
  }

  getCurrentAnnouncementPriority() {
    return this.queue.find(item => 
      item.announcement._id === this.currentAnnouncement._id
    )?.priority || 999;
  }

  cleanup() {
    this.currentAnnouncement = null;
    this.isProcessing = false;
  }

  onAnnouncementEnd(playlistAudio) {
    console.log('Announcement ended, cleaning up');
    
    // Anons bitti, temizle
    this.cleanup();
    
    // Eğer playlist çalıyorduysa devam ettir
    if (this.wasPlaylistPlaying) {
      console.log('Resuming playlist after announcement');
      setTimeout(() => {
        playlistAudio.play().catch(err => {
          console.error('Error resuming playlist:', err);
        });
      }, 100);
    }
    
    // Sıradaki anonsu işle
    if (this.queue.length > 0) {
      console.log('Processing next announcement in queue');
      this.processQueue(playlistAudio, campaignAudio);
    }
  }
}

module.exports = new AnnouncementQueueManager();