import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { AnnouncementForm, AnnouncementFormData } from "./AnnouncementForm";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export const CreateAnnouncementDialog = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (data: AnnouncementFormData) => {
    const response = await fetch("http://localhost:5000/api/announcements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Anons oluşturulurken bir hata oluştu");
    }

    queryClient.invalidateQueries({ queryKey: ["announcements"] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Anons
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Anons Oluştur</DialogTitle>
        </DialogHeader>
        <AnnouncementForm 
          onSubmit={handleSubmit}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};