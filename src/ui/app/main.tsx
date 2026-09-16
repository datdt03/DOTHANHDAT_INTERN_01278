import { StrictMode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { runtimeConfig } from '../config/runtime-config';
import { createApiClient } from '../shared/api/api-client';
import { ApiUnavailableScreen, BootScreen } from './app-shell';
import { RouteBoundary } from './routes';
import { SessionProvider } from './session-context';
import '../features/access/access.css';
import '../shared/styles/target.css';
import '../shared/styles/app-shell.css';

type BootstrapStatus = 'booting' | 'unavailable' | 'ready';

const apiClient = createApiClient(runtimeConfig.apiBaseUrl, runtimeConfig.apiTimeoutMs);

function App() {
  const [status, setStatus] = useState<BootstrapStatus>(runtimeConfig.previewMode ? 'ready' : 'booting');
  const [message, setMessage] = useState('');
  const [previewMode, setPreviewMode] = useState(runtimeConfig.previewMode);

  const checkApi = useCallback(async () => {
    setStatus('booting');
    setMessage('');

    try {
      await apiClient.getHealth();
      setStatus('ready');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'API hiện chưa sẵn sàng.');
      setStatus('unavailable');
    }
  }, []);

  useEffect(() => {
    if (!previewMode) {
      void checkApi();
    }
  }, [checkApi, previewMode]);

  if (status === 'booting') {
    return <BootScreen />;
  }

  if (status === 'unavailable' && !previewMode) {
    return <ApiUnavailableScreen message={message} onRetry={checkApi} onUsePreview={() => setPreviewMode(true)} />;
  }

  return (
    <SessionProvider>
      <RouteBoundary previewMode={previewMode} onRetry={checkApi} />
    </SessionProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
