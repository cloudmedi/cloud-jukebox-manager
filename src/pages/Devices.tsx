import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Plus, StopCircle, Search } from "lucide-react";
import { DeviceList } from "@/components/devices/DeviceList";
import DeviceGroups from "@/components/devices/DeviceGroups";
import DeviceForm from "@/components/devices/DeviceForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import axios from "axios";
import { toast } from "sonner";

const Devices = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "online" | "offline">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("_all");
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['device-stats'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/stats/devices');
      if (!response.ok) {
        throw new Error('Veriler yüklenirken bir hata oluştu');
      }
      return response.json();
    }
  });

  const handleEmergencyStop = async () => {
    try {
      await axios.post('http://localhost:5000/api/devices/emergency-stop');
      toast.success('Acil durum komutu gönderildi. Tüm cihazlar durduruluyor.');
      setShowEmergencyDialog(false);
    } catch (error) {
      console.error('Emergency stop error:', error);
      toast.error('Acil durum komutu gönderilemedi!');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Cihaz Yönetimi</h1>
          <p className="text-muted-foreground">
            Cihazları ve lokasyonları yönetin
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Toplam Cihaz</span>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-2">{stats?.total || 0}</p>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Çevrimiçi</span>
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </div>
            <p className="text-2xl font-bold mt-2 text-green-500">{stats?.online || 0}</p>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Çevrimdışı</span>
              <div className="h-2 w-2 rounded-full bg-red-500" />
            </div>
            <p className="text-2xl font-bold mt-2 text-red-500">{stats?.offline || 0}</p>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Aktif Playlist</span>
              <div className="h-2 w-2 rounded-full bg-blue-500" />
            </div>
            <p className="text-2xl font-bold mt-2 text-blue-500">{stats?.withPlaylist || 0}</p>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="devices" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="devices">Cihazlar</TabsTrigger>
              <TabsTrigger value="groups">Gruplar</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Cihaz ara..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[300px]"
                />
              </div>

              <Select value={filterStatus} onValueChange={(value: "all" | "online" | "offline") => setFilterStatus(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü ({stats?.total || 0})</SelectItem>
                  <SelectItem value="online">Çevrimiçi ({stats?.online || 0})</SelectItem>
                  <SelectItem value="offline">Çevrimdışı ({stats?.offline || 0})</SelectItem>
                </SelectContent>
              </Select>

              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Bölge" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Tüm Bölgeler</SelectItem>
                  <SelectItem value="istanbul">İstanbul</SelectItem>
                  <SelectItem value="ankara">Ankara</SelectItem>
                  <SelectItem value="izmir">İzmir</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="destructive" 
                onClick={() => setShowEmergencyDialog(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Acil Durum Durdurma
              </Button>

              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Cihaz Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DeviceForm onSuccess={() => setIsFormOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <TabsContent value="devices">
            <DeviceList />
          </TabsContent>
          <TabsContent value="groups">
            <DeviceGroups />
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Acil Durum Durdurma</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem tüm cihazları durduracak ve ses çalmayı sonlandıracaktır. 
              Bu işlem geri alınamaz ve sadece yönetici tarafından tekrar aktif edilebilir.
              Devam etmek istediğinizden emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleEmergencyStop}
              className="bg-red-600 hover:bg-red-700"
            >
              Acil Durum Durdurma
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Devices;