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
import Timetable from './sessions/Timetable';
import CreatePost from './post/CreatePost';
import EditPost from './post/EditPost';

const router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      {
        index: true,
        Component: Timetable,
      },
      {
        path: "/LoginView",
        Component: LoginView
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
        path: "/create",
        Component: CreatePost
      },
      {
        path: "/edit/:id",
        Component: EditPost
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