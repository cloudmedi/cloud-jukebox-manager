import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { UploadForm } from "@/components/devices/UploadForm";

const Upload = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <>
      <h1>Music Upload</h1>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button onClick={() => setIsFormOpen(true)}>Yeni Müzik Yükle</Button>
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>Yükle</Button>
          </DialogTrigger>
          <DialogContent>
            <UploadForm onSuccess={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Upload;
