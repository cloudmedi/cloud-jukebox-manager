import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, StopCircle, Play, Plus } from "lucide-react";
import { DeviceList } from "@/components/devices/DeviceList";
import DeviceGroups from "@/components/devices/DeviceGroups";
import { DeviceHeader } from "@/components/devices/DeviceHeader";
import { DeviceStats } from "@/components/devices/DeviceStats";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import DeviceForm from "@/components/devices/DeviceForm";

const Devices = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "online" | "offline">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("_all");
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Cihaz Yönetimi</h1>
        <p className="text-muted-foreground">
          Cihazları ve lokasyonları yönetin
        </p>
      </div>

      <DeviceStats />

      <Tabs defaultValue="devices" className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="devices">Cihazlar</TabsTrigger>
              <TabsTrigger value="groups">Gruplar</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cihaz ara..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterStatus} onValueChange={(value: "all" | "online" | "offline") => setFilterStatus(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="online">Çevrimiçi</SelectItem>
                <SelectItem value="offline">Çevrimdışı</SelectItem>
              </SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tüm Bölgeler" />
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
              className={`${isEmergencyActive ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isEmergencyActive ? (
                <Play className="h-4 w-4 mr-2" />
              ) : (
                <StopCircle className="h-4 w-4 mr-2" />
              )}
              {isEmergencyActive ? 'Acil Durumu Kaldır' : 'Acil Durum'}
            </Button>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <Button onClick={() => setIsFormOpen(true)} variant="default">
                <Plus className="h-4 w-4 mr-2" />
                Cihaz Ekle
              </Button>
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

      <DeviceHeader 
        isEmergencyActive={isEmergencyActive}
        setIsEmergencyActive={setIsEmergencyActive}
        isFormOpen={isFormOpen}
        setIsFormOpen={setIsFormOpen}
        showEmergencyDialog={showEmergencyDialog}
        setShowEmergencyDialog={setShowEmergencyDialog}
      />
    </div>
  );
};

export default Devices;