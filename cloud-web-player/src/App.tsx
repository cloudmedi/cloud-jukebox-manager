import { TokenInitializer } from './components/TokenInitializer';
import { Router } from './Router';

const App = () => {
  return (
    <TokenInitializer>
      <Router />
    </TokenInitializer>
  );
};

export default App;