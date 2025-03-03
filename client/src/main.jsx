import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {SocketProvider}  from './contexts/SocketContext';
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
} from "react-router-dom";
import App from './App';
import Resive from './Resive';
const router=createBrowserRouter(createRoutesFromElements(
  <>
<Route path='/' element={<App/>}/> 
  <Route path='resive/:id' element={<Resive/>}/>

  </>
  
))
createRoot(document.getElementById('root')).render(
  <SocketProvider >
    <RouterProvider router={router} >
   
      <App />
 
    </RouterProvider>
    </SocketProvider >
)
