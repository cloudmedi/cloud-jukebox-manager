import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface FormData {
  name: string;
  description: string;
  devices: string[];
}

interface DeviceGroupFormProps {
  onSuccess?: () => void;
}

const DeviceGroupForm = ({ onSuccess }: DeviceGroupFormProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDevices, setSelectedDevices] = useState<Array<{ _id: string; name: string }>>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      devices: [],
    },
  });

  const { data: devices } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) throw new Error("Cihazlar yüklenemedi");
      return response.json();
    },
  });

  const filteredDevices = devices?.filter((device: any) => 
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedDevices.find(selected => selected._id === device._id)
  ) || [];

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("http://localhost:5000/api/device-groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          devices: selectedDevices.map(device => device._id),
          createdBy: "admin",
        }),
      });

      if (!response.ok) throw new Error("Grup oluşturulamadı");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-groups"] });
      toast({
        title: "Başarılı",
        description: "Grup başarıyla oluşturuldu",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message,
      });
    },
  });

  const handleAddDevice = (device: any) => {
    setSelectedDevices([...selectedDevices, { _id: device._id, name: device.name }]);
    setSearchTerm("");
  };

  const handleRemoveDevice = (deviceId: string) => {
    setSelectedDevices(selectedDevices.filter(device => device._id !== deviceId));
  };

  const onSubmit = async (data: FormData) => {
    await mutation.mutateAsync({
      ...data,
      devices: selectedDevices.map(device => device._id),
    });
  };

  return (
    <div className="space-y-4">
      <DialogTitle className="text-xl font-semibold mb-4">
        Yeni Grup Oluştur
      </DialogTitle>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grup Adı</FormLabel>
                <FormControl>
                  <Input placeholder="Grup adı giriniz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Açıklama</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Grup açıklaması giriniz"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>Cihazlar</FormLabel>
            <div className="flex gap-2">
              <Input
                placeholder="Cihaz ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="button" size="icon" variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {searchTerm && filteredDevices.length > 0 && (
              <ScrollArea className="h-32 border rounded-md p-2">
                {filteredDevices.map((device: any) => (
                  <div
                    key={device._id}
                    className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer"
                    onClick={() => handleAddDevice(device)}
                  >
                    <span>{device.name}</span>
                    <Plus className="h-4 w-4" />
                  </div>
                ))}
              </ScrollArea>
            )}

            <div className="flex flex-wrap gap-2 mt-2">
              {selectedDevices.map((device) => (
                <Badge
                  key={device._id}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {device.name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveDevice(device._id)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full">
            Grup Oluştur
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default DeviceGroupForm;