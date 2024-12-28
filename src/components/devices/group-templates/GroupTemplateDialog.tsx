import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const GroupTemplateDialog = () => {
  const [open, setOpen] = useState(false);
  const [rule, setRule] = useState("location");
  const [prefix, setPrefix] = useState("");

  const { data: devices = [] } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) throw new Error("Cihazlar yüklenemedi");
      return response.json();
    },
  });

  const handleCreateGroups = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/device-groups/auto-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rule, prefix }),
      });

      if (!response.ok) throw new Error("Gruplar oluşturulamadı");

      toast.success("Gruplar başarıyla oluşturuldu");
      setOpen(false);
    } catch (error) {
      toast.error("Gruplar oluşturulurken bir hata oluştu");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Otomatik Grup Oluştur
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Otomatik Grup Oluşturma</DialogTitle>
          <DialogDescription>
            Seçtiğiniz kurala göre cihazlar için otomatik gruplar oluşturulacak
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Gruplama Kuralı</Label>
            <Select value={rule} onValueChange={setRule}>
              <SelectTrigger>
                <SelectValue placeholder="Kural seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="location">Lokasyona Göre</SelectItem>
                <SelectItem value="status">Duruma Göre</SelectItem>
                <SelectItem value="custom">Özel Kural</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Grup İsim Öneki</Label>
            <Input
              placeholder="Örn: Mağaza-"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            İptal
          </Button>
          <Button onClick={handleCreateGroups}>
            Grupları Oluştur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};