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
          return `<svg class="${commonClasses} text-green-500" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12" y2="20"/></svg>`;
        }
        return `<svg class="${commonClasses} text-yellow-500" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12" y2="20"/></svg>`;
      case 'offline':
      default:
        return `<svg class="${commonClasses} text-red-500" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12" y2="20"/></svg>`;
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