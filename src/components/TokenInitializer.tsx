import { useEffect } from "react";
import { useToken } from "@/hooks/useToken";
import { websocketService } from "@/services/websocketService";

export const TokenInitializer = () => {
  const { token } = useToken();

  useEffect(() => {
    if (token) {
      websocketService.setToken(token);
    }
  }, [token]);

  return null;
};