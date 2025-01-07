import { render, screen, fireEvent } from '@testing-library/react/pure';
import { PlaylistForm } from '../components/playlists/PlaylistForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach } from 'vitest';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('PlaylistForm', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('renders form fields correctly', () => {
    renderWithProviders(<PlaylistForm />);
    
    expect(screen.getByLabelText(/playlist adı/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/açıklama/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /oluştur/i })).toBeInTheDocument();
  });

  it('shows validation error for empty playlist name', async () => {
    renderWithProviders(<PlaylistForm />);
    
    const submitButton = screen.getByRole('button', { name: /oluştur/i });
    fireEvent.click(submitButton);
    
    expect(await screen.findByText(/playlist adı gereklidir/i)).toBeInTheDocument();
  });
});