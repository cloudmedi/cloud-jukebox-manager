import { DeviceList } from "@/components/devices/DeviceList";
import DeviceGroups from "@/components/devices/DeviceGroups";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import DeviceForm from "@/components/devices/DeviceForm";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Devices = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "online" | "offline">("all");

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

        {/* Filters Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cihaz ara..." 
                className="pl-9"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={(value: "all" | "online" | "offline") => setFilterStatus(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tümü (14)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü ({stats?.total || 0})</SelectItem>
                <SelectItem value="online">Çevrimiçi ({stats?.online || 0})</SelectItem>
                <SelectItem value="offline">Çevrimdışı ({stats?.offline || 0})</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Bölge" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Bölgeler</SelectItem>
                <SelectItem value="istanbul">İstanbul</SelectItem>
                <SelectItem value="ankara">Ankara</SelectItem>
                <SelectItem value="izmir">İzmir</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
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
          <TabsList>
            <TabsTrigger value="devices">Cihazlar</TabsTrigger>
            <TabsTrigger value="groups">Gruplar</TabsTrigger>
          </TabsList>
          <TabsContent value="devices">
            <DeviceList />
          </TabsContent>
          <TabsContent value="groups">
            <DeviceGroups />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Devices;