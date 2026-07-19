import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { MdEditCalendar } from "react-icons/md";
import { IoIosLogOut } from "react-icons/io";
import { CiUser } from "react-icons/ci";
import { CgGym } from "react-icons/cg";
import { FaBlog } from "react-icons/fa";
import { MdOutlinePreview } from "react-icons/md";
import { FaRegCalendarAlt } from "react-icons/fa";
import { FaListAlt } from "react-icons/fa";
import { useAuthenticate } from "../authentication/UseAuthenticate";

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
      icon: <FaRegCalendarAlt />,
      label: "Booking",
      visible: user && user.role === "member",
    },
    {
      path: "/Timetable",
      icon: <FaListAlt />,
      label: "Timetable",
      visible: user && user.role === "member",
    },
    {
      path: "/Blog",
      icon: <FaBlog />,
      label: "Blog",
      visible: true, // Visible to guests, members, and trainers
    },
    {

      path: "/sessionTrainer",
      icon: <MdOutlinePreview />,
      label: "Sessions",
      visible: user && user.role === "trainer",
    },
    {

      path: "/update",
      icon: <CiUser />,
      label: "Profile",
      visible: user && (user.role === "trainer" || user.role === "member"),
    },
  ];

  return (
    <div className="bg-base-200 min-h-screen py-4 px-2 flex flex-col justify-between">
      <main className="max-w-[430px] w-full min-h-[92vh] mx-auto shadow-2xl bg-base-100 rounded-2xl overflow-hidden flex flex-col justify-between border border-base-300">

        {/* Header Branding Area */}
        <div>
          <header className="flex items-center justify-center bg-base-100 border-b border-base-200 py-4 px-6">
            <button
              className="flex items-center gap-2 hover:opacity-80 transition active:scale-95"
              onClick={() => navigate(user ? (user.role === "trainer" ? "/sessionTrainer" : "/MakeBooking") : "/")}
            >
              <CgGym className="text-3xl text-success" />
              <h1 className="text-xl font-black tracking-tight text-neutral">HSG Fitness Community</h1>
            </button>
          </header>

          {/* Child Routes Injection point */}
          <div className="p-4">
            <Outlet />
          </div>
        </div>

        {/* Persistent Bottom Nav Bar Matrix */}
        <div>
          <nav className="grid grid-flow-col auto-cols-max justify-around items-center py-2 bg-base-100 border-t border-base-200 px-2">
            {navItems.map(({ path, icon, label, visible }) => {
              if (!visible) return null;
              if (isAuthView && path !== "/blog") return null;

              const isActive = location.pathname === path;

              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${isActive
                    ? "text-success font-bold scale-105"
                    : "text-base-content/70 hover:text-base-content"
                    }`}
                >
                  <span className="text-xl">{icon}</span>
                  <span className="text-[11px] tracking-wide">{label}</span>
                </button>
              );
            })}

            {/* Logout Switch Action Interface */}
            {!isAuthView && user && (
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="flex flex-col items-center gap-0.5 px-3 py-1 text-error/80 hover:text-error transition"
              >
                <IoIosLogOut className="text-xl" />
                <span className="text-[11px] tracking-wide">Log Out</span>
              </button>
            )}
          </nav>

          {/* Footer Branding Footnotes */}
          <footer className="text-center text-[10px] text-base-content/40 py-4 border-t border-base-200/50 bg-base-50">
            <p className="text-black">© {new Date().getFullYear()} HSG — Yesterianus Kaladana.</p>
            <p className=" text-black mt-0.5">
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