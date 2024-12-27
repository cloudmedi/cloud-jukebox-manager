import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, AlertOctagon } from "lucide-react";
import { DeviceList } from "@/components/devices/DeviceList";
import DeviceGroups from "@/components/devices/DeviceGroups";
import { DeviceStats } from "@/components/devices/DeviceStats";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DeviceGroupForm } from "@/components/devices/DeviceGroupForm";

const Devices = () => {
  const [activeTab, setActiveTab] = useState("devices");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Cihaz Yönetimi</h1>
          <p className="text-muted-foreground">
            Cihazları ve lokasyonları yönetin
          </p>
        </div>

        {activeTab === "groups" && (
          <Dialog open={isGroupFormOpen} onOpenChange={setIsGroupFormOpen}>
            <Button onClick={() => setIsGroupFormOpen(true)} variant="default">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Grup
            </Button>
            <DialogContent>
              <DeviceGroupForm onSuccess={() => setIsGroupFormOpen(false)} />
            </DialogContent>
          </Dialog>
        )}

        {activeTab === "devices" && (
          <>
            <div className="flex items-center gap-4">
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <Button onClick={() => setIsFormOpen(true)} variant="default">
                  <Plus className="h-4 w-4 mr-2" />
                  Cihaz Ekle
                </Button>
              </Dialog>

              <Button
                variant="destructive"
                onClick={() => setShowEmergencyDialog(true)}
                className={`${isEmergencyActive ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                <AlertOctagon className="h-4 w-4 mr-2" />
                {isEmergencyActive ? 'Acil Durumu Kaldır' : 'Acil Durum'}
              </Button>
            </div>
          </>
        )}
      </div>

      <DeviceStats />

      <Tabs defaultValue="devices" className="space-y-4" onValueChange={setActiveTab}>
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
  );
};

export default Devices;