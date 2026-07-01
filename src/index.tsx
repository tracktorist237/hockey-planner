import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/theme.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { notifyServiceWorkerUpdate } from "./components/AppUpdatePrompt";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import { installClientDebugLog, writeClientDebugEvent } from "./utils/clientDebugLog";

installClientDebugLog();
writeClientDebugEvent("app.boot.start");

const writeBootLog = (event: string, details?: Record<string, unknown>) => {
  const bootWriter = (window as Window & { __hpBootWriteLog?: (event: string, details?: Record<string, unknown>) => void }).__hpBootWriteLog;
  if (bootWriter) {
    bootWriter(event, details);
  }
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
writeClientDebugEvent("app.boot.render.called");
writeBootLog("app.boot.render.called");
root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);
window.setTimeout(() => {
  const rootElement = document.getElementById("root");
  writeClientDebugEvent("app.boot.rendered", {
    rootHasChildren: Boolean(rootElement?.children.length),
    rootTextLength: rootElement?.textContent?.trim().length ?? 0,
  });
  writeBootLog("app.boot.rendered", {
    rootHasChildren: Boolean(rootElement?.children.length),
    rootTextLength: rootElement?.textContent?.trim().length ?? 0,
  });
}, 0);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
serviceWorkerRegistration.register({
  onUpdate: notifyServiceWorkerUpdate,
});
reportWebVitals();
