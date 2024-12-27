import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SongList } from "./SongList";
import { AddSongDialog } from "./AddSongDialog";
import { SongSkeleton } from "./SongSkeleton";
import { Song } from "@/types/song";
import { Table } from "@headlessui/react";

interface SongListProps {
  songs: Song[];
  onDelete: (songId: string) => Promise<void>;
  onEdit?: (song: Song) => void;
}

const SongList = ({
  songs,
  onDelete,
  onEdit,
}: SongListProps) => {
  const { toast } = useToast();

  const handleDelete = async (songId: string) => {
    try {
      await onDelete(songId);
      toast({
        title: "Başarılı",
        description: "Şarkı başarıyla silindi",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Şarkı silinirken bir hata oluştu",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table className="min-w-full divide-y divide-gray-200">
          <Table.Head className="bg-gray-50">
            <Table.Row>
              <Table.Cell className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Şarkı
              </Table.Cell>
              <Table.Cell className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sanatçı
              </Table.Cell>
              <Table.Cell className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tür
              </Table.Cell>
              <Table.Cell className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Albüm
              </Table.Cell>
              <Table.Cell className="relative px-6 py-3">
                <span className="sr-only">İşlemler</span>
              </Table.Cell>
            </Table.Row>
          </Table.Head>
          <Table.Body className="bg-white divide-y divide-gray-200">
            {songs.map((song) => (
              <Table.Row key={song._id} className="hover:bg-gray-50">
                <Table.Cell className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{song.name}</div>
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{song.artist}</div>
                </Table.Cell>
                <Table.Cell className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{song.genre}</div>
                </Table.Cell>
                <Table.Cell className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{song.album || "-"}</div>
                </Table.Cell>
                <Table.Cell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    variant="ghost"
                    onClick={() => onEdit?.(song)}
                    className="text-indigo-600 hover:text-indigo-900 mr-2"
                  >
                    Düzenle
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleDelete(song._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Sil
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </div>
  );
};

export default SongList;