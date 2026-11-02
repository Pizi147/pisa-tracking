import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { SessionProvider } from './lib/session.tsx';
import { ToastProvider } from './ui/Toast.tsx';
// Phông tự phục vụ (T16, Q8): cùng tên miền, không gọi Google; trình duyệt chỉ tải bộ vietnamese + latin cần dùng (unicode-range).
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/be-vietnam-pro/700.css';
import '@fontsource/be-vietnam-pro/800.css';
import './index.css';

/* CHAN-ROI-NHAP: `useBlocker` chỉ chạy trong data router. Một route `*` bọc cả app, đường dẫn thật vẫn khai ở `<Routes>` trong App. */
const router = createBrowserRouter([{
  path: '*',
  element: (
    <ToastProvider>
      <SessionProvider>
        <App />
      </SessionProvider>
    </ToastProvider>
  ),
}]);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
