import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Plus, StopCircle, Play } from "lucide-react";
import DeviceForm from "./DeviceForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import axios from "axios";

interface DeviceHeaderProps {
  isEmergencyActive: boolean;
  setIsEmergencyActive: (value: boolean) => void;
  isFormOpen: boolean;
  setIsFormOpen: (value: boolean) => void;
  showEmergencyDialog: boolean;
  setShowEmergencyDialog: (value: boolean) => void;
}

export const DeviceHeader = ({
  isEmergencyActive,
  setIsEmergencyActive,
  isFormOpen,
  setIsFormOpen,
  showEmergencyDialog,
  setShowEmergencyDialog,
}: DeviceHeaderProps) => {
  const handleEmergencyStop = async () => {
    try {
      if (!isEmergencyActive) {
        await axios.post('http://localhost:5000/api/devices/emergency-stop');
        toast.success('Acil durum komutu gönderildi. Tüm cihazlar durduruluyor.');
        setIsEmergencyActive(true);
      } else {
        await axios.post('http://localhost:5000/api/devices/emergency-reset');
        toast.success('Acil durum kaldırıldı. Cihazlar normal çalışmaya devam ediyor.');
        setIsEmergencyActive(false);
      }
      setShowEmergencyDialog(false);
    } catch (error) {
      console.error('Emergency action error:', error);
      toast.error('Acil durum komutu gönderilemedi!');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Cihaz Yönetimi</h1>
      <p className="text-muted-foreground">
        Cihazları ve lokasyonları yönetin
      </p>

      <AlertDialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isEmergencyActive ? 'Acil Durumu Kaldır' : 'Acil Durum Durdurma'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEmergencyActive 
                ? 'Bu işlem tüm cihazları normal çalışma durumuna döndürecek ve müzik yayınını devam ettirecektir. Devam etmek istediğinizden emin misiniz?' 
                : 'Bu işlem tüm cihazları durduracak ve ses çalmayı sonlandıracaktır. Bu işlem geri alınamaz ve sadece yönetici tarafından tekrar aktif edilebilir. Devam etmek istediğinizden emin misiniz?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleEmergencyStop}
              className={`${isEmergencyActive ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isEmergencyActive ? 'Acil Durumu Kaldır' : 'Acil Durum Durdurma'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Cihaz Ekle
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DeviceForm onSuccess={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};