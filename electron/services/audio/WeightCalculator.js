class WeightCalculator {
  constructor() {
    this.THREE_HOURS = 3 * 60 * 60 * 1000;
    this.SIX_HOURS = 6 * 60 * 60 * 1000;
    this.ONE_DAY = 24 * 60 * 60 * 1000;
  }

  calculateWeight(lastPlayedTime) {
    const currentTime = Date.now();
    const timeSinceLastPlay = currentTime - lastPlayedTime;

    if (timeSinceLastPlay < this.THREE_HOURS) {
      return 0; // Çalınamaz
    } else if (timeSinceLastPlay < this.SIX_HOURS) {
      return 1; // Düşük öncelik
    } else if (timeSinceLastPlay < this.ONE_DAY) {
      return 2; // Orta öncelik
    } else {
      return 3; // Yüksek öncelik
    }
  }
}

module.exports = WeightCalculator;