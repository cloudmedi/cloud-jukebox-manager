import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Users, Calendar, UserCircle } from "lucide-react";
import type { DeviceGroup } from "../types";

interface GroupBasicInfoProps {
  group: DeviceGroup;
}

export const GroupBasicInfo = ({ group }: GroupBasicInfoProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Temel Bilgiler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Grup Adı</h4>
              <p className="text-lg font-medium">{group.name}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Durum</h4>
              <p className="text-lg font-medium capitalize">{group.status}</p>
            </div>
          </div>

          {group.description && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Açıklama</h4>
              <p>{group.description}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Cihaz Sayısı</p>
                <p className="font-medium">{group.devices.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Oluşturulma Tarihi</p>
                <p className="font-medium">
                  {format(new Date(group.createdAt), "dd MMM yyyy", { locale: tr })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Oluşturan</p>
                <p className="font-medium">{group.createdBy}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};