class AudioFader {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  connectSource(audioElement) {
    const source = this.audioContext.createMediaElementSource(audioElement);
    source.connect(this.gainNode);
  }

  async fadeOut(duration = 2) {
    const currentTime = this.audioContext.currentTime;
    this.gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);
    return new Promise(resolve => setTimeout(resolve, duration * 1000));
  }

  async fadeIn(duration = 2) {
    const currentTime = this.audioContext.currentTime;
    this.gainNode.gain.setValueAtTime(0, currentTime);
    this.gainNode.gain.linearRampToValueAtTime(1, currentTime + duration);
    return new Promise(resolve => setTimeout(resolve, duration * 1000));
  }

  setVolume(value) {
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(value, this.audioContext.currentTime);
    }
  }
}

module.exports = AudioFader;