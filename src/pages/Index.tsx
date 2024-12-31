import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initializeToken = async () => {
      try {
        // Check localStorage first
        let currentToken = localStorage.getItem('device_token');
        console.log('Checking localStorage for token:', currentToken);

        if (!currentToken) {
          // Generate new token if none exists
          currentToken = Math.floor(100000 + Math.random() * 900000).toString();
          console.log('Generated new token:', currentToken);
          localStorage.setItem('device_token', currentToken);
        }

        setToken(currentToken);
      } catch (error) {
        console.error('Token initialization error:', error);
        toast({
          title: "Hata",
          description: "Token oluşturulurken bir hata oluştu.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeToken();
  }, [toast]);

  const copyToClipboard = async () => {
    if (token) {
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
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-6">
      <Card className="w-full max-w-md mx-auto bg-white">
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-purple-500" />
            <CardTitle className="text-2xl font-bold text-purple-900">
              Cihaz Token
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 flex items-center justify-between">
            <code className="text-lg font-mono text-purple-700">{token}</code>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyToClipboard}
              className="hover:bg-purple-100"
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