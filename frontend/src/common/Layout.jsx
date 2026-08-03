import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthenticate } from "../authentication/UseAuthenticate";
import { IoIosLogOut } from "react-icons/io";
import { CiUser } from "react-icons/ci";
import { CgGym } from "react-icons/cg";
import { FaBlog, FaRegCalendarAlt, FaListAlt } from "react-icons/fa";
import { MdOutlinePreview } from "react-icons/md";

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthenticate();

  const isAuthView =
    location.pathname === "/" ||
    location.pathname === "/register" ||
    location.pathname === "/login";

  const navItems = [
    {
      path: "/Booking",
      icon: FaRegCalendarAlt,
      label: "My Booking",
      visible: user && user.role === "member",
    },
    {
      path: "/Timetable",
      icon: FaListAlt,
      label: "My Timetable",
      visible: user && user.role === "member",
    },
    {
      path: "/Blog",
      icon: FaBlog,
      label: "My Blog",
      visible: user && (user.role === "member" || user.role === "trainer"),
    },
    {
      path: "/sessionTrainer",
      icon: MdOutlinePreview,
      label: "Trainer Session",
      visible: user && user.role === "trainer",
    },
    {
      path: "/update",
      icon: CiUser,
      label: "My Profile",
      visible: user && (user.role === "member" || user.role === "trainer"),
    },
    {
      path: "/session",
      icon: FaListAlt,
      label: "Sessions",
      visible: !user,
    },
  ];

  return (
    <div className="bg-base-200 min-h-screen py-4 px-2 flex flex-col justify-between">

      <main className="max-w-[430px] w-full min-h-[92vh] mx-auto shadow-2xl bg-base-100 rounded-2xl overflow-hidden flex flex-col justify-between border border-base-300">

        <div>

          <header className="flex items-center justify-center bg-base-100 border-b border-base-200 py-4 px-6">

            <button
              className="flex items-center gap-2 hover:opacity-80 transition active:scale-95"
              onClick={() => navigate(user ? (user.role === "trainer" ? "/sessionTrainer" : "/MakeBooking") : "/")}
            >

              <CgGym className="text-3xl text-success" />

              <h1 className="text-xl font-black tracking-tight text-neutral">
                HSG Fitness Community
              </h1>

            </button>

          </header>

          <div className="p-4">
            <Outlet />
          </div>

        </div>


        <div>

          <nav className="grid grid-flow-col auto-cols-max justify-around items-center py-2 bg-base-100 border-t border-base-200 px-2">

            {navItems.map(({ path, icon, label, visible }) => {

              if (!visible) return null;

              const isActive = location.pathname === path;

              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${isActive ? "text-success font-bold scale-105" : "text-base-content/70 hover:text-base-content"}`}
                >

                  <span className="text-xl">
                    {React.createElement(icon)}
                  </span>

                  <span className="text-[11px] tracking-wide">
                    {label}
                  </span>

                </button>
              );

            })}


            {!isAuthView && user && (
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="flex flex-col items-center gap-0.5 px-3 py-1 text-error/80 hover:text-error transition"
              >

                <IoIosLogOut className="text-xl" />

                <span className="text-[11px] tracking-wide">
                  Log Out
                </span>

              </button>
            )}

          </nav>


          <footer className="text-center text-[10px] text-base-content/40 py-4 border-t border-base-200/50 bg-base-50">

            <p className="text-black mt-0.5">

              <button
                onClick={() => navigate("/privacy-policy")}
                className="underline hover:text-success transition"
              >
                Privacy Policy
              </button>

            </p>

          </footer>

        </div>

      </main>

    </div>
  );

}

export default Layout;