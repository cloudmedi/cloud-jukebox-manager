import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface TokenValidationResult {
  isValid: boolean;
  isUsed: boolean;
  deviceInfo?: any;
}

export const useTokenValidation = () => {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const { toast } = useToast();

  const validateToken = async (token: string): Promise<TokenValidationResult> => {
    try {
      const response = await fetch(`http://localhost:5000/api/tokens/validate/${token}`);
      if (!response.ok) {
        throw new Error("Geçersiz token");
      }
      const data = await response.json();
      setDeviceInfo(data.deviceInfo);
      
      if (!data.isUsed) {
        toast({
          title: "Token Doğrulandı",
          description: "Token geçerli ve kullanılabilir.",
          className: "bg-[#F2FCE2] border-green-500",
          duration: 5000,
        });
      }
      
      return {
        isValid: true,
        isUsed: data.isUsed,
        deviceInfo: data.deviceInfo
      };
    } catch (error) {
      setDeviceInfo(null);
      throw error;
    }
  };

  return { deviceInfo, validateToken };
};