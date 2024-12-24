import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { AnnouncementForm } from "./AnnouncementForm";
import { useState } from "react";

export const CreateAnnouncementDialog = () => {
  const [open, setOpen] = useState(false);

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
        <AnnouncementForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};