import { Shield, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface TokenDisplayProps {
  token: string;
}

export const TokenDisplay = ({ token }: TokenDisplayProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      toast({
        title: "Token Kopyalandı",
        description: "Token panoya kopyalandı.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Hata",
        description: "Token kopyalanırken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-purple-50 to-white border-purple-100">
      <CardHeader className="space-y-1">
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-purple-500" />
          <CardTitle className="text-2xl font-bold text-purple-900">Cihaz Token</CardTitle>
        </div>
        <CardDescription className="text-purple-600">
          Bu token cihazınızı tanımlamak için kullanılır. Lütfen güvenli bir şekilde saklayın.
        </CardDescription>
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
  );
};