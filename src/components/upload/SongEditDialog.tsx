import { Dialog } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Song } from "@/types/song";

interface SongEditDialogProps {
  song: Song | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const genres = ["Pop", "Rock", "Jazz", "Classical", "Electronic", "Christmas", "Chill Out", "Other"];

const SongEditDialog = ({ song, open, onOpenChange }: SongEditDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<Song>>({});

  useEffect(() => {
    if (song) {
      setFormData({
        name: song.name,
        artist: song.artist,
        genre: song.genre,
        album: song.album || "",
        year: song.year || undefined,
        language: song.language || ""
      });
    }
  }, [song]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!song?._id) return;

    try {
      const response = await fetch(`http://localhost:5000/api/songs/${song._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update song");

      toast({
        title: "Başarılı",
        description: "Şarkı bilgileri güncellendi",
      });

      queryClient.invalidateQueries({ queryKey: ["songs"] });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Şarkı güncellenirken bir hata oluştu",
      });
    }
  };

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Şarkı Bilgilerini Düzenle
          </Dialog.Title>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Şarkı Adı</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="artist">Sanatçı</Label>
              <Input
                id="artist"
                value={formData.artist || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, artist: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="genre">Tür</Label>
              <select
                id="genre"
                value={formData.genre}
                onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tür seçin</option>
                {genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="album">Albüm</Label>
              <Input
                id="album"
                value={formData.album || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, album: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="year">Yıl</Label>
              <Input
                id="year"
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={formData.year || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, year: Number(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="language">Dil</Label>
              <Input
                id="language"
                value={formData.language || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
              />
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                İptal
              </Button>
              <Button type="submit">Kaydet</Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default SongEditDialog;