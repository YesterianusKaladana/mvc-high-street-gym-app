
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

    const isTrainer = user?.role === "trainer";
    const isMember = user?.role === "member";

    // Change the timetable label for trainers
    const timetableLabel = isTrainer ? "My Sessions" : "Timetable";

    // Check whether the timetable dock item is active
    const isTimetableActive = isTrainer
        ? location.pathname === "/session"
        : location.pathname === "/timetable" ||
        location.pathname === "/";

    return (
        <main className="max-w-[430px] min-h-screen mx-auto shadow">
            <header>
                <div className="navbar justify-between bg-base-100 shadow-sm">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="btn btn-ghost text-lg"
                    >
                        <FaDumbbell />
                        HSG
                    </button>

                    {user ? (
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="btn btn-ghost text-lg text-error"
                            aria-label="Logout"
                        >
                            <p className="text-sm opacity-60 mt-2">
                                <span className="badge badge-primary badge-sm">
                                    {user.firstName} {user.lastName}
                                </span>
                            </p>
                            <TbLogout />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="btn btn-ghost text-lg text-success"
                            aria-label="Login"
                        >
                            <TbLogin />
                        </button>
                    )}
                </div>
            </header>

            {/* Page content */}
            <div className="pb-24">
                <Outlet />
            </div>

            {/* Bottom dock navigation */}
            <nav className="dock fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 gap-2.5">
                <button
                    type="button"
                    onClick={() =>
                        navigate(isTrainer ? "/session" : "/timetable")
                    }
                    className={isTimetableActive ? "dock-active" : ""}
                    aria-current={isTimetableActive ? "page" : undefined}
                >
                    <FaCalendarAlt className="text-2xl" />
                    <span className="dock-label">
                        {timetableLabel}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => navigate("/blog")}
                    className={
                        location.pathname.startsWith("/blog")
                            ? "dock-active"
                            : ""
                    }
                    aria-current={
                        location.pathname.startsWith("/blog")
                            ? "page"
                            : undefined
                    }
                >
                    <FaBlog className="text-2xl" />
                    <span className="dock-label">Blog</span>
                </button>

                {/* Bookings are hidden for trainers */}
                {!isTrainer && (
                    <button
                        type="button"
                        disabled={!isMember}
                        onClick={() => navigate("/booking")}
                        className={
                            location.pathname.startsWith("/booking")
                                ? "dock-active"
                                : ""
                        }
                        aria-current={
                            location.pathname.startsWith("/booking")
                                ? "page"
                                : undefined
                        }
                    >
                        <FaDumbbell className="text-2xl" />
                        <span className="dock-label">Bookings</span>
                    </button>
                )}

                <button
                    type="button"
                    disabled={!user}
                    onClick={() => navigate("/user/self")}
                    className={
                        location.pathname.startsWith("/user/self")
                            ? "dock-active"
                            : ""
                    }
                    aria-current={
                        location.pathname.startsWith("/user/self")
                            ? "page"
                            : undefined
                    }
                >
                    <FaUser className="text-2xl" />
                    <span className="dock-label">Profile</span>
                </button>
            </nav>
        </main>
    );
}

export default Layout;
