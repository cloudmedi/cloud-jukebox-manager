import { useEffect } from 'react';
import { useToken } from '../hooks/useToken';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Loader2 } from 'lucide-react';

interface TokenInitializerProps {
  children: React.ReactNode;
}

export const TokenInitializer = ({ children }: TokenInitializerProps) => {
  const { token, isLoading, error } = useToken();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to initialize device token: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="p-4">
        <Alert variant="warning">
          <AlertTitle>No Token</AlertTitle>
          <AlertDescription>
            Device token is not available. Please refresh the page or contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};