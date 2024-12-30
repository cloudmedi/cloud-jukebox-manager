import { useState, useEffect } from "react";
import { Music, Radio, Bell, Clock, Cloud, Settings } from "lucide-react";

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A1F2C] to-[#221F26] text-white">
      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-[#1A1F2C]/90 backdrop-blur-md py-4" : "py-6"
      }`}>
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-[#9b87f5]">Cloud Jukebox</div>
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="hover:text-[#9b87f5] transition-colors">Özellikler</a>
            <a href="#library" className="hover:text-[#9b87f5] transition-colors">Müzik Kütüphanesi</a>
            <a href="#contact" className="hover:text-[#9b87f5] transition-colors">İletişim</a>
          </div>
          <button className="bg-[#9b87f5] hover:bg-[#7E69AB] transition-colors px-6 py-2 rounded-full">
            Başla
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#9b87f5] to-[#D946EF] text-transparent bg-clip-text">
            Profesyonel Müzik Yönetim Sistemi
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            15.000+ telifsiz müzik ile mekanınızın atmosferini kontrol edin
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button className="bg-[#9b87f5] hover:bg-[#7E69AB] transition-colors px-8 py-3 rounded-full text-lg">
              Hemen Deneyin
            </button>
            <button className="border border-[#9b87f5] hover:bg-[#9b87f5]/10 transition-colors px-8 py-3 rounded-full text-lg">
              Demo İzleyin
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Öne Çıkan Özellikler
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Music className="w-8 h-8 text-[#9b87f5]" />}
              title="15.000+ Telifsiz Müzik"
              description="Geniş müzik kütüphanemiz ile mekanınıza uygun müzikleri seçin"
            />
            <FeatureCard
              icon={<Radio className="w-8 h-8 text-[#9b87f5]" />}
              title="Çoklu Cihaz Kontrolü"
              description="Tüm şubelerinizi tek bir merkezden yönetin"
            />
            <FeatureCard
              icon={<Bell className="w-8 h-8 text-[#9b87f5]" />}
              title="Anons Yönetimi"
              description="Otomatik ve manuel anonsları kolayca planlayın"
            />
            <FeatureCard
              icon={<Clock className="w-8 h-8 text-[#9b87f5]" />}
              title="Zaman Bazlı Çalma Listeleri"
              description="Günün saatine göre otomatik müzik değişimi"
            />
            <FeatureCard
              icon={<Cloud className="w-8 h-8 text-[#9b87f5]" />}
              title="Uzaktan Erişim"
              description="Her yerden sisteminizi kontrol edin"
            />
            <FeatureCard
              icon={<Settings className="w-8 h-8 text-[#9b87f5]" />}
              title="Kolay Yönetim"
              description="Kullanıcı dostu arayüz ile hızlı kontrol"
            />
          </div>
        </div>
      </section>

      {/* Library Section */}
      <section id="library" className="py-20 px-4 bg-[#1A1F2C]/50">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Zengin Müzik Kütüphanesi
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            15.000'den fazla telifsiz müzik içeren kütüphanemiz ile mekanınıza en uygun müzikleri seçin. Pop, Rock, Jazz, Lounge ve daha fazlası...
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <StatCard number="15,000+" label="Telifsiz Müzik" />
            <StatCard number="20+" label="Müzik Kategorisi" />
            <StatCard number="100+" label="Hazır Playlist" />
            <StatCard number="24/7" label="Teknik Destek" />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Hemen Başlayın
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Profesyonel müzik yönetim sistemimiz ile tanışmak için hemen iletişime geçin
          </p>
          <button className="bg-[#9b87f5] hover:bg-[#7E69AB] transition-colors px-8 py-3 rounded-full text-lg">
            İletişime Geçin
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="container mx-auto text-center text-gray-400">
          <p>© 2024 Cloud Jukebox. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}

const FeatureCard = ({ icon, title, description }) => (
  <div className="p-6 rounded-xl bg-[#1A1F2C]/50 hover:bg-[#1A1F2C]/70 transition-colors">
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-300">{description}</p>
  </div>
);

const StatCard = ({ number, label }) => (
  <div className="p-6 rounded-xl bg-[#1A1F2C]/30">
    <div className="text-3xl font-bold text-[#9b87f5] mb-2">{number}</div>
    <div className="text-gray-300">{label}</div>
  </div>
);