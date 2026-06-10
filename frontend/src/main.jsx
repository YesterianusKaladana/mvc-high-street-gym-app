import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthenticationProvider } from './authentication/UseAuthenticate';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './common/Layout'
import LoginView from './authentication/LoginView'
import Register from './authentication/Register'
import BlogView from './post/BlogView'
import UserInformation from './user/UserInformation';
import TrainerSession from './sessions/TrainerSession';

const router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      {
        index: true,
        Component: LoginView,
      },
      {
        path: "/register",
        Component: Register
      },
      {
        path: "/BlogView",
        Component: BlogView
      },
      {
        path: "/update", 
        Component: UserInformation
      },
      {
        path: "/sessionTrainer", 
        Component: TrainerSession
      },
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthenticationProvider>
      <RouterProvider router={router} />
    </AuthenticationProvider>
  </StrictMode>,
)