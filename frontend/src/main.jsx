import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthenticationProvider } from './authentication/UseAuthenticate';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import Layout from './common/Layout'
import LoginView from './authentication/LoginView'
import Register from './authentication/Register'
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
        path: "/timetable/sessions",
        element: <Navigate to="/timetable" replace />,
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