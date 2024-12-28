import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Users, Calendar, Laptop, CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface GroupPreviewCardProps {
  group: any;
  children: React.ReactNode;
}

export const GroupPreviewCard = ({ group, children }: GroupPreviewCardProps) => {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">{group.name}</h4>
            {group.description && (
              <p className="text-sm text-muted-foreground">{group.description}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{group.devices?.length || 0} cihaz</span>
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
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Laptop className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Cihaz Durumu</span>
              </div>
              {group.status === 'active' ? (
                <Badge className="bg-emerald-500/15 text-emerald-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Aktif
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-500/15 text-gray-500">
                  <XCircle className="h-3 w-3 mr-1" />
                  Pasif
                </Badge>
              )}
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};