import React from 'react';
import ReactDOM from 'react-dom/client';
import { FluentProvider, webLightTheme} from '@fluentui/react-components';
import './index.css';
import App from './App';
import SignInGate from './components/SignInGate';
import { AuthStore } from './stores/auth';
import GlobalToaster from './components/Toaster';
import { testOfficeIntegration, simulateOfficeContext } from './utils/officeTest';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Initialize Office.js testing
if (process.env.NODE_ENV === 'development') {
  // Simulate Office context in development if not available
  simulateOfficeContext();
  
  // Test Office integration after a short delay
  setTimeout(() => {
    testOfficeIntegration();
  }, 1000);
}

const Root: React.FC = () => {
  const [authed, setAuthed] = React.useState(!!(AuthStore.getState().jwt && AuthStore.getState().graphToken))

  React.useEffect(() => {
    const unsub = AuthStore.subscribe(s => setAuthed(!!(s.jwt && s.graphToken)))
    return unsub
  }, [])

  return (
    <FluentProvider theme={webLightTheme} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <GlobalToaster />
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {authed ? <App /> : <SignInGate onSignedIn={() => setAuthed(true)} />}
      </div>
    </FluentProvider>
  )
}

root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

// optional for dark mode later on - "webDarkTheme" 