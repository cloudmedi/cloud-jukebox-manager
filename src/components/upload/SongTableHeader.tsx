import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const SongTableHeader = () => {
  return (
    <TableHeader>
      <TableRow>
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