import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export const GroupTemplateDialog = () => {
  const { toast } = useToast();
  
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["group-templates"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/device-groups?template=true");
      if (!response.ok) throw new Error("Şablonlar yüklenemedi");
      const data = await response.json();
      return data.groups;
    }
  });

  const handleUseTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/device-groups/${templateId}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${templates.find(t => t._id === templateId)?.name} Kopyası`,
          createdBy: "admin" // TODO: Gerçek kullanıcı bilgisi eklenecek
        })
      });

      if (!response.ok) throw new Error("Şablon kullanılamadı");

      toast({
        title: "Başarılı",
        description: "Grup şablondan oluşturuldu",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Şablon kullanılırken bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Şablonlar</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Grup Şablonları</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid gap-4">
            {isLoading ? (
              <div>Yükleniyor...</div>
            ) : templates.length === 0 ? (
              <div>Henüz şablon bulunmuyor</div>
            ) : (
              templates.map((template: any) => (
                <Card key={template._id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle>{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    <Button onClick={() => handleUseTemplate(template._id)} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Kullan
                    </Button>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};