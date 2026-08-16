import { useEffect } from "react";
import { FaDumbbell, FaCalendarAlt, FaBlog, FaUser } from "react-icons/fa";
import { TbLogout, TbLogin } from "react-icons/tb";
import { Outlet, useNavigate, useLocation } from "react-router";
import { useAuthenticate } from "../authentication/UseAuthenticate";


function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthenticate();

    // Redirect to login on logout
    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const isTrainer = user && user.role === "trainer";
    const isMember = user && user.role === "member";

    // Timetable label changes to "My Sessions" for trainers
    const timetableLabel = isTrainer ? "My Sessions" : "Timetable";

    return (
        <main className="max-w-[430px] min-h-screen mx-auto shadow">
            <header>
                <div className="navbar justify-between bg-base-100 shadow-sm">
                    <button className="btn btn-ghost text-lg">
                        <FaDumbbell />
                        HSG
                    </button>
                    {user ? (
                        <button
                            onClick={handleLogout}
                            className="btn btn-ghost text-lg text-error"
                        >
                            <TbLogout />
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate("/login")}
                            className="btn btn-ghost text-lg text-success"
                        >
                            <TbLogin />
                        </button>
                    )}
                </div>
            </header>

            {/* Page content */}
            <Outlet />

            {/* Bottom dock nav */}
            <nav className="dock max-w-[430px] mx-auto gap-2.5">
                <button onClick={() => navigate("/timetable")}
                    className={location.pathname === "/timetable" || location.pathname === "/" ? "dock-active" : ""}>
                    <FaCalendarAlt className="text-2xl" />
                    <span className="dock-label">{timetableLabel}</span>
                </button>

                <button onClick={() => navigate("/blog")}
                    className={location.pathname.startsWith("/blog") ? "dock-active" : ""}>
                    <FaBlog className="text-2xl" />
                    <span className="dock-label">Blog</span>
                </button>

                {/* Bookings — hidden for trainers entirely */}
                {!isTrainer && (
                    <button
                        disabled={!isMember}
                        onClick={() => navigate("/booking")}
                        className={location.pathname.startsWith("/booking") ? "dock-active" : ""}>
                        <FaDumbbell className="text-2xl" />
                        <span className="dock-label">Bookings</span>
                    </button>
                )}

                <button disabled={!user} onClick={() => navigate("/user/self")}
                    className={location.pathname.startsWith("/user/self") ? "dock-active" : ""}>
                    <FaUser className="text-2xl" />
                    <span className="dock-label">Profile</span>
                </button>
            </nav>

        </main>

    );
}

export default Layout;
