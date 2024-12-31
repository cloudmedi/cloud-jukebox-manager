import { TokenInitializer } from './components/TokenInitializer';
import { Router } from './Router';
import ErrorBoundary from './components/ErrorBoundary';

const App = () => {
  return (
    <ErrorBoundary>
      <TokenInitializer>
        <Router />
      </TokenInitializer>
    </ErrorBoundary>
  );
};

export default App;