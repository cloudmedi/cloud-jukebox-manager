import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Edit, Trash2, FolderPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface PlaylistCardProps {
  playlist: {
    _id: string;
    name: string;
    description?: string;
    songs: any[];
  };
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onPlay: (id: string) => void;
}

export const PlaylistCard = ({
  playlist,
  onDelete,
  onEdit,
  onPlay,
}: PlaylistCardProps) => {
  const [isAddingToCategory, setIsAddingToCategory] = useState(false);
  const { toast } = useToast();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/categories");
      if (!response.ok) throw new Error("Kategoriler yüklenemedi");
      return response.json();
    },
  });

  const handleAddToCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/categories/${categoryId}/playlists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playlists: [playlist._id] }),
      });

      if (!response.ok) throw new Error("Playlist kategoriye eklenemedi");

      toast({
        title: "Başarılı",
        description: "Playlist kategoriye eklendi",
      });
      setIsAddingToCategory(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Playlist kategoriye eklenirken bir hata oluştu",
      });
    }
  };

  return (
    <Card className="group relative overflow-hidden">
      <CardContent className="p-4">
        <div className="aspect-square rounded-md bg-muted mb-4" />
        <h3 className="font-semibold truncate">{playlist.name}</h3>
        {playlist.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {playlist.description}
          </p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          {playlist.songs.length} şarkı
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPlay(playlist._id)}
          >
            <Play className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(playlist._id)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          {isAddingToCategory ? (
            <Select onValueChange={handleAddToCategory}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Kategori seç" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category: any) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAddingToCategory(true)}
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(playlist._id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};