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
import CreatePost from './post/CreatePost';
import DeletePost from './post/DeletePost';
import SessionView from './sessions/SessionView';
import BrowseSessionView from './sessions/BrowseSessionView';
import BookingView from './booking/BookingView';

const router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      {
        index: true,
        Component: SessionView,
      },
      {
        path: "/login",
        Component: LoginView
      },
      {
        path: "/timetable",
        Component: BrowseSessionView
      },
      {
        path: "/booking",
        Component: BookingView
      },
      {
        path: "/register",
        Component: Register
      },
      {
        path: "/blog",
        Component: BlogView
      },
      {
        path: "/create",
        Component: CreatePost
      },
      {
        path: "/delete/:id",
        Component: DeletePost
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