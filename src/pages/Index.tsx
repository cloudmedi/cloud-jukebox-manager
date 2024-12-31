import { useEffect, useState } from "react";
import { tokenService } from "@/services/tokenService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [token, setToken] = useState<string | null>(null);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const initToken = async () => {
      console.log("Initializing token...");
      let currentToken = tokenService.getToken();
      
      if (!currentToken) {
        console.log("No token found, generating new token...");
        try {
          currentToken = await tokenService.generateToken();
          console.log("New token generated:", currentToken);
        } catch (error) {
          console.error("Error generating token:", error);
          toast({
            title: "Hata",
            description: "Token oluşturulurken bir hata oluştu.",
            variant: "destructive",
          });
          return;
        }
      }

      console.log("Setting token:", currentToken);
      setToken(currentToken);
    };

    initToken();
  }, []);

  const copyToClipboard = async () => {
    if (!token) return;
    
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      toast({
        title: "Başarılı",
        description: "Token kopyalandı",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Hata",
        description: "Token kopyalanırken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-md mx-auto bg-white shadow-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-purple-500" />
            <CardTitle className="text-xl font-semibold">Cihaz Token</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 rounded-lg border flex items-center justify-between">
            <code className="text-lg font-mono text-purple-700">{token}</code>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyToClipboard}
              className="hover:bg-gray-100"
            >
              {copied ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Copy className="h-5 w-5 text-purple-500" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;