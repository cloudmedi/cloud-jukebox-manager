import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const useTokenValidation = () => {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const { toast } = useToast();

  const validateToken = async (token: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tokens/validate/${token}`);
      if (!response.ok) {
        throw new Error("Geçersiz token");
      }
      const data = await response.json();
      setDeviceInfo(data.deviceInfo);
      toast({
        title: "Token Doğrulandı",
        description: "Token geçerli ve kullanılabilir.",
        className: "bg-[#F2FCE2] border-green-500",
        duration: 10000,
      });
      return data;
    } catch (error) {
      setDeviceInfo(null);
      throw error;
    }
  };

  return { deviceInfo, validateToken };
};