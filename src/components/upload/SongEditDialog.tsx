import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Song {
  _id: string;
  name: string;
  artist: string;
  genre: string;
  album?: string;
  year?: number;
  language?: string;
}

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

  // Şarkı verisi değiştiğinde form verilerini güncelle
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Şarkı Bilgilerini Düzenle</DialogTitle>
          <DialogDescription>
            Şarkı bilgilerini güncellemek için aşağıdaki formu kullanın.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Şarkı Adı</Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="artist">Sanatçı</Label>
            <Input
              id="artist"
              value={formData.artist || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, artist: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="genre">Tür</Label>
            <Select
              value={formData.genre}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, genre: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tür seçin" />
              </SelectTrigger>
              <SelectContent>
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="album">Albüm</Label>
            <Input
              id="album"
              value={formData.album || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, album: e.target.value }))
              }
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
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, year: Number(e.target.value) }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Dil</Label>
            <Input
              id="language"
              value={formData.language || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, language: e.target.value }))
              }
            />
          </div>
          <div className="flex justify-end space-x-2">
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
      </DialogContent>
    </Dialog>
  );
};

export default SongEditDialog;