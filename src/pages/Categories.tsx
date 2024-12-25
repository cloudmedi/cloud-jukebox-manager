import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const Categories = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const { toast } = useToast();

  const { data: categories, refetch } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/categories");
      if (!response.ok) throw new Error("Kategoriler yüklenemedi");
      return response.json();
    },
  });

  const handleCreateCategory = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCategory),
      });

      if (!response.ok) throw new Error("Kategori oluşturulamadı");

      toast({
        title: "Başarılı",
        description: "Kategori başarıyla oluşturuldu",
      });

      setNewCategory({ name: "", description: "" });
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kategori oluşturulurken bir hata oluştu",
      });
    }
  };

  const handleAddPlaylistToCategory = async (categoryId: string, playlistId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/categories/${categoryId}/playlists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playlists: [playlistId] }),
      });

      if (!response.ok) throw new Error("Playlist eklenemedi");

      toast({
        title: "Başarılı",
        description: "Playlist kategoriye eklendi",
      });

      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Playlist eklenirken bir hata oluştu",
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kategori Yönetimi</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Kategori
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Kategori Oluştur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Kategori Adı</label>
                <Input
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  placeholder="Kategori adı girin"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Açıklama</label>
                <Input
                  value={newCategory.description}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, description: e.target.value })
                  }
                  placeholder="Kategori açıklaması girin"
                />
              </div>
              <Button onClick={handleCreateCategory} className="w-full">
                Oluştur
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.map((category: any) => (
          <Card key={category._id}>
            <CardHeader>
              <CardTitle>{category.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {category.description}
              </p>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Playlistler</h3>
                <div className="space-y-1">
                  {category.playlists?.map((playlist: any) => (
                    <div
                      key={playlist._id}
                      className="text-sm text-muted-foreground"
                    >
                      {playlist.name}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Categories;