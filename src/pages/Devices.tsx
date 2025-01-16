import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, AlertOctagon } from "lucide-react";
import { DeviceList } from "@/components/devices/DeviceList";
import DeviceGroups from "@/components/devices/DeviceGroups";
import { DeviceStats } from "@/components/devices/DeviceStats";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import DeviceForm from "@/components/devices/DeviceForm";
import { deviceService } from "@/services/deviceService";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDownloadProgressStore } from "@/store/downloadProgressStore";

const Devices = () => {
  const [activeTab, setActiveTab] = useState("devices");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "online" | "offline" | "loading" | "error" | "no_playlist" | "muted" | "no_group" | "needs_update"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("_all");
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);

  const { data: devices = [] } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/devices');
      if (!response.ok) {
        throw new Error('Cihazlar yüklenirken bir hata oluştu');
      }
      return response.json();
    },
    refetchInterval: 5000
  });

  const { progressMap } = useDownloadProgressStore();

  // Benzersiz lokasyonları memoize ediyoruz
  const uniqueLocations = useMemo(() => 
    Array.from(new Set(devices.map(device => device.location))).filter(Boolean),
    [devices]
  );

  // Şu anki en son versiyon (normalde API'den gelecek)
  const LATEST_VERSION = "1.0.0";

  // Filtreleme fonksiyonlarını memoize ediyoruz
  const filterFunctions = useMemo(() => ({
    matchesSearch: (device: any) => 
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.token.toLowerCase().includes(searchQuery.toLowerCase()),

    matchesLocation: (device: any) => 
      locationFilter === "_all" || device.location === locationFilter,

    matchesStatus: (device: any) => {
      const deviceProgress = progressMap[device.token];
      const isLoading = deviceProgress?.status === 'downloading';
      const hasError = deviceProgress?.status === 'error';
      const hasNoPlaylist = !device.activePlaylist && !device.downloadProgress?.playlistId;
      const isMuted = device.volume === 0;
      const hasNoGroup = !device.groupId;
      const needsUpdate = device.deviceInfo?.browserInfo?.version !== LATEST_VERSION;

      return filterStatus === "all" ||
        (filterStatus === "online" && device.isOnline) ||
        (filterStatus === "offline" && !device.isOnline) ||
        (filterStatus === "loading" && isLoading) ||
        (filterStatus === "error" && hasError) ||
        (filterStatus === "no_playlist" && hasNoPlaylist) ||
        (filterStatus === "muted" && isMuted) ||
        (filterStatus === "no_group" && hasNoGroup) ||
        (filterStatus === "needs_update" && needsUpdate);
    }
  }), [searchQuery, locationFilter, filterStatus, progressMap, LATEST_VERSION]);

  // Filtrelenmiş cihazları memoize ediyoruz
  const filteredDevices = useMemo(() => 
    devices.filter(device => 
      filterFunctions.matchesSearch(device) &&
      filterFunctions.matchesLocation(device) &&
      filterFunctions.matchesStatus(device)
    ),
    [devices, filterFunctions]
  );

  const handleEmergencyAction = useCallback(async () => {
    try {
      if (!isEmergencyActive) {
        await deviceService.emergencyStop();
        setIsEmergencyActive(true);
        toast.success('Acil durum aktifleştirildi. Tüm cihazlar durduruldu.');
      } else {
        await deviceService.emergencyReset();
        setIsEmergencyActive(false);
        toast.success('Acil durum kaldırıldı. Cihazlar normal çalışmaya devam ediyor.');
      }
      setShowEmergencyDialog(false);
    } catch (error) {
      console.error('Emergency action error:', error);
      toast.error('İşlem başarısız oldu');
    }
  }, [isEmergencyActive]);

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cihaz Yönetimi</h1>
          <p className="text-base text-muted-foreground mt-1">
            Cihazları ve lokasyonları yönetin
          </p>
        </div>
        
        <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
          <DialogTrigger asChild>
            <Button variant={isEmergencyActive ? "destructive" : "outline"} className="gap-2">
              <AlertOctagon className="h-4 w-4" />
              {isEmergencyActive ? "Acil Durum Aktif" : "Acil Durum"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <div className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <h2 className="text-lg font-semibold">
                  {isEmergencyActive ? 'Acil Durumu Kaldır' : 'Acil Durum Durdurma'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isEmergencyActive 
                    ? 'Bu işlem tüm cihazları normal çalışma durumuna döndürecek ve müzik yayınını devam ettirecektir. Devam etmek istediğinizden emin misiniz?' 
                    : 'Bu işlem tüm cihazları durduracak ve ses çalmayı sonlandıracaktır. Bu işlem geri alınamaz ve sadece yönetici tarafından tekrar aktif edilebilir. Devam etmek istediğinizden emin misiniz?'}
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowEmergencyDialog(false)}>
                  İptal
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleEmergencyAction}
                  className={isEmergencyActive ? 'bg-yellow-600 hover:bg-yellow-700' : undefined}
                >
                  {isEmergencyActive ? 'Acil Durumu Kaldır' : 'Acil Durum Durdurma'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DeviceStats />

      <Tabs defaultValue="devices" className="space-y-6" onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
          <TabsList className="bg-background border">
            <TabsTrigger value="devices" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Cihazlar</TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Gruplar</TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-1 items-center gap-4">
              <Input
                placeholder="Cihaz ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[250px]"
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="online">Çevrimiçi</SelectItem>
                  <SelectItem value="offline">Çevrimdışı</SelectItem>
                  <SelectItem value="loading">Yükleniyor</SelectItem>
                  <SelectItem value="error">Hata</SelectItem>
                  <SelectItem value="no_playlist">Playlist Yok</SelectItem>
                  <SelectItem value="muted">Ses Kapalı</SelectItem>
                  <SelectItem value="no_group">Grup Yok</SelectItem>
                  <SelectItem value="needs_update">Güncelleme Gerekli</SelectItem>
                </SelectContent>
              </Select>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Tüm Bölgeler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Tüm Bölgeler</SelectItem>
                  {uniqueLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto gap-2 ml-auto">
                  <Plus className="h-4 w-4" />
                  Cihaz Ekle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DeviceForm onSuccess={() => setIsFormOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="devices" className="space-y-4">
          <DeviceList 
            devices={filteredDevices}
            selectedDevices={selectedDevices}
            onDeviceSelect={(deviceToken, checked) => {
              setSelectedDevices(prev => 
                checked 
                  ? [...prev, deviceToken]
                  : prev.filter(token => token !== deviceToken)
              );
            }}
          />
        </TabsContent>

        <TabsContent value="groups" className="m-0">
          <DeviceGroups />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Devices;