import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GroupBasicInfo } from "./GroupBasicInfo";
import { GroupDeviceList } from "./GroupDeviceList";
import { GroupStatistics } from "./GroupStatistics";
import { GroupHistory } from "./GroupHistory";
import type { DeviceGroup } from "../types";

interface GroupDetailsDialogProps {
  group: DeviceGroup;
  isOpen: boolean;
  onClose: () => void;
}

export const GroupDetailsDialog = ({ group, isOpen, onClose }: GroupDetailsDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Grup Detayları: {group.name}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="info">Genel Bilgiler</TabsTrigger>
              <TabsTrigger value="devices">Cihazlar</TabsTrigger>
              <TabsTrigger value="stats">İstatistikler</TabsTrigger>
              <TabsTrigger value="history">Geçmiş</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <GroupBasicInfo group={group} />
            </TabsContent>

            <TabsContent value="devices">
              <GroupDeviceList groupId={group._id} />
            </TabsContent>

            <TabsContent value="stats">
              <GroupStatistics groupId={group._id} />
            </TabsContent>

            <TabsContent value="history">
              <GroupHistory groupId={group._id} />
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};