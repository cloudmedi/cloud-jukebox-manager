import { Shield, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TokenDisplayProps {
  token: string;
}

export const TokenDisplay = ({ token }: TokenDisplayProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      toast.success("Token kopyalandı");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Token kopyalanırken bir hata oluştu");
    }
  };

  return (
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
  );
};