import React from 'react';
import { toast } from '@/hooks/use-toast';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error) {
    console.error('Error caught by boundary:', error);
    toast({
      variant: "destructive",
      title: "Uygulama Hatası",
      description: "Beklenmeyen bir hata oluştu"
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Bir Hata Oluştu</h2>
            <p className="text-muted-foreground">
              Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;