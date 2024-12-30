import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Music2, 
  Radio, 
  Bell, 
  Clock, 
  Users, 
  BarChart3, 
  Volume2,
  Laptop
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Cloud Jukebox Manager
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Profesyonel müzik yayın sistemi ile cihazlarınızı uzaktan yönetin, 
              playlistler oluşturun ve anonslarınızı planlayın.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/devices")}
                className="bg-primary hover:bg-primary/90"
              >
                <Laptop className="mr-2 h-5 w-5" />
                Cihazları Yönet
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/playlists")}
              >
                <Music2 className="mr-2 h-5 w-5" />
                Playlistleri Görüntüle
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Özellikler
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Playlist Yönetimi */}
            <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Music2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Playlist Yönetimi</h3>
              <p className="text-muted-foreground">
                Sürükle-bırak ile kolay playlist oluşturma, düzenleme ve cihazlara gönderme
              </p>
            </Card>

            {/* Cihaz Kontrolü */}
            <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Radio className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Cihaz Kontrolü</h3>
              <p className="text-muted-foreground">
                Tüm cihazları tek bir arayüzden yönetin, durumlarını izleyin
              </p>
            </Card>

            {/* Anons Sistemi */}
            <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Anons Sistemi</h3>
              <p className="text-muted-foreground">
                Zamanlanmış veya anlık anonslar, öncelik yönetimi
              </p>
            </Card>

            {/* Zamanlama */}
            <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Zamanlama</h3>
              <p className="text-muted-foreground">
                Playlistler ve anonslar için gelişmiş zamanlama seçenekleri
              </p>
            </Card>

            {/* Grup Yönetimi */}
            <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Grup Yönetimi</h3>
              <p className="text-muted-foreground">
                Cihazları gruplara ayırarak toplu yönetim imkanı
              </p>
            </Card>

            {/* Raporlama */}
            <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Raporlama</h3>
              <p className="text-muted-foreground">
                Detaylı çalma geçmişi ve sistem durumu raporları
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">
            Hemen Başlayın
          </h2>
          <p className="text-xl text-muted-foreground">
            Cloud Jukebox Manager ile müzik yayınınızı profesyonel seviyeye taşıyın
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate("/devices")}
            className="bg-primary hover:bg-primary/90"
          >
            <Volume2 className="mr-2 h-5 w-5" />
            Sistemi Yönet
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;