import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { SocketProvider } from './contexts/SocketContext';
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
} from "react-router-dom";
import App from './App';
import Resive from './Resive';
import { Toaster } from 'react-hot-toast';
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path='/' element={<App />} />
      <Route path='recive/:connectionId' element={<Resive />} />
    </>
  )
);
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SocketProvider>
      <RouterProvider router={router} />
      <Toaster position="top-center" reverseOrder={false} />
    </SocketProvider>
  </StrictMode>
);
