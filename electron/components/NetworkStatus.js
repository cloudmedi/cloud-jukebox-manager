const { WifiHigh, WifiLow, WifiOff } = require('lucide-react');

class NetworkStatus {
  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'network-status fixed bottom-4 right-4 transition-all duration-300';
    this.render('offline');
    
    this.setupTooltip();
    this.setupAnimation();
  }

  setupTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tooltip hidden absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded shadow-lg';
    this.element.appendChild(this.tooltip);

    this.element.addEventListener('mouseenter', () => {
      this.tooltip.classList.remove('hidden');
      this.tooltip.classList.add('animate-fade-in');
    });

    this.element.addEventListener('mouseleave', () => {
      this.tooltip.classList.add('hidden');
      this.tooltip.classList.remove('animate-fade-in');
    });
  }

  setupAnimation() {
    this.element.classList.add('hover:scale-110', 'transition-transform', 'duration-200');
  }

  getStatusIcon(status, strength) {
    const size = 24;
    const commonClasses = 'transition-colors duration-300';
    
    switch (status) {
      case 'online':
        if (strength === 'high') {
          return `<svg class="${commonClasses} text-green-500" width="${size}" height="${size}">${WifiHigh}</svg>`;
        }
        return `<svg class="${commonClasses} text-yellow-500" width="${size}" height="${size}">${WifiLow}</svg>`;
      case 'offline':
      default:
        return `<svg class="${commonClasses} text-red-500" width="${size}" height="${size}">${WifiOff}</svg>`;
    }
  }

  getStatusText(status, strength) {
    switch (status) {
      case 'online':
        return strength === 'high' ? 'İnternet bağlantısı güçlü' : 'İnternet bağlantısı zayıf';
      case 'offline':
        return 'İnternet bağlantısı yok';
      default:
        return 'Bağlantı kontrol ediliyor...';
    }
  }

  render(status, strength) {
    this.element.innerHTML = this.getStatusIcon(status, strength);
    this.tooltip.textContent = this.getStatusText(status, strength);
  }

  mount(container) {
    container.appendChild(this.element);
  }
}

module.exports = NetworkStatus;