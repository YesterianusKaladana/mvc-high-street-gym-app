import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthenticationProvider } from './authentication/UseAuthenticate';
import { createBrowserRouter, RouterProvider } from 'react-router';
import Layout from './common/Layout'
import LoginView from './authentication/LoginView'
import Register from './authentication/Register'
import MySessionsView from './sessions/MySessionsView';
import BookingView from './booking/BookingView';
import BlogView from './post/BlogView';
import ProfileView from './profile/ProfileView';
import TimetableView from './timetable/TimetableView';

const router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      {
        index: true,
        Component: TimetableView,
      },
      {
        path: "/timetable",
        Component: TimetableView,
      },
      {
        path: "/login",
        Component: LoginView
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
        path: "/user/self",
        Component: ProfileView
      },
      {
        path: "/session",
        Component: MySessionsView
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