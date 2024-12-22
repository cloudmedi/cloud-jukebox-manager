import DeviceList from "@/components/devices/DeviceList";
import DeviceGroups from "@/components/devices/DeviceGroups";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Devices = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cihaz Yönetimi</h2>
        <p className="text-muted-foreground">
          Cihazları ve cihaz gruplarını yönetin
        </p>
      </div>

      <Tabs defaultValue="devices">
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