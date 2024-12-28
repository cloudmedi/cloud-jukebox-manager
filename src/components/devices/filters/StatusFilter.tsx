import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StatusFilterProps {
  status: "all" | "online" | "offline";
  onChange: (status: "all" | "online" | "offline") => void;
}

export const StatusFilter = ({ status, onChange }: StatusFilterProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <Filter className="h-4 w-4 mr-2" />
          Durum
          {status !== "all" && (
            <Badge variant="secondary" className="ml-2 bg-primary/20">
              {status === "online" ? "Çevrimiçi" : "Çevrimdışı"}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuCheckboxItem
          checked={status === "all"}
          onCheckedChange={() => onChange("all")}
        >
          Tümü
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={status === "online"}
          onCheckedChange={() => onChange("online")}
        >
          Çevrimiçi
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={status === "offline"}
          onCheckedChange={() => onChange("offline")}
        >
          Çevrimdışı
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};