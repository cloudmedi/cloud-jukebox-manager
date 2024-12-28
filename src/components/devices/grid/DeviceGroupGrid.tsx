import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { DeviceGroupActions } from "../DeviceGroupActions";
import type { DeviceGroup } from "../types";

interface DeviceGroupGridProps {
  groups: DeviceGroup[];
  selectedGroups: string[];
  onSelectGroup: (groupId: string, checked: boolean) => void;
  onRefresh: () => void;
}

export const DeviceGroupGrid = ({
  groups,
  selectedGroups,
  onSelectGroup,
  onRefresh
}: DeviceGroupGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {groups.map((group) => (
        <Card key={group._id} className={`
          transition-all duration-200 hover:shadow-lg
          ${group.status === 'active' ? 'bg-emerald-50/50' : 'bg-gray-50/50'}
        `}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedGroups.includes(group._id)}
                  onCheckedChange={(checked) => onSelectGroup(group._id, checked === true)}
                />
                <div>
                  <h3 className="font-medium">{group.name}</h3>
                  {group.description && (
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{group.devices.length} cihaz</span>
              </div>
              {group.status === 'active' ? (
                <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Aktif
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-500/15 text-gray-500 hover:bg-gray-500/25">
                  <XCircle className="h-3 w-3 mr-1" />
                  Pasif
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDistanceToNow(new Date(group.createdAt), {
                  addSuffix: true,
                  locale: tr,
                })}
              </span>
            </div>
          </CardContent>
          <CardFooter className="pt-2 flex justify-end">
            <DeviceGroupActions group={group} onSuccess={onRefresh} />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};