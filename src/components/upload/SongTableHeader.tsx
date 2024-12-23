import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SongTableHeaderProps {
  showCheckbox?: boolean;
}

export const SongTableHeader = ({ showCheckbox = false }: SongTableHeaderProps) => {
  return (
    <TableHeader>
      <TableRow>
        {showCheckbox && <TableHead className="w-[50px]"></TableHead>}
        <TableHead>Şarkı</TableHead>
        <TableHead>Sanatçı</TableHead>
        <TableHead>Tür</TableHead>
        <TableHead>Albüm</TableHead>
        <TableHead>Süre</TableHead>
        <TableHead>Eklenme Tarihi</TableHead>
        <TableHead className="w-[70px]"></TableHead>
      </TableRow>
    </TableHeader>
  );
};