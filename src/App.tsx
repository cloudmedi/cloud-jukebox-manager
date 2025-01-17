import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MainLayout } from "./components/layout/MainLayout";
import { Toaster } from "./components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import Index from "./pages/Index";
import Devices from "./pages/Devices";
import Playlists from "./pages/Playlists";
import NewPlaylist from "./pages/NewPlaylist";
import Schedule from "./pages/Schedule";
import Announcements from "./pages/Announcements";
import Upload from "./pages/Upload";
import Reports from "./pages/Reports";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="cloud-media-theme">
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <BrowserRouter>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/devices" element={<Devices />} />
                <Route path="/playlists" element={<Playlists />} />
                <Route path="/playlists/new" element={<NewPlaylist />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/reports" element={<Reports />} />
              </Route>
            </Routes>
            <Toaster />
            <SonnerToaster position="top-right" expand={true} richColors />
          </BrowserRouter>
        </ErrorBoundary>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;