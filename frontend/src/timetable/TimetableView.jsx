import { useCallback, useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { fetchAPI } from "../api.mjs";
import { useNavigate } from "react-router";
import { useAuthenticate } from "../authentication/UseAuthenticate";

function TimetableView() {
    const [filter, setFilter] = useState("");
    const [sessions, setSessions] = useState([]);
    const [error, setError] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [isBooking, setIsBooking] = useState(false);
    const [bookingError, setBookingError] = useState(null);
    const [bookedSessionIds, setBookedSessionIds] = useState([]);
    const [isLoadingBookings, setIsLoadingBookings] = useState(false);

    const navigate = useNavigate();
    const { user } = useAuthenticate();
    const authKey = localStorage.getItem("auth-key");
    const isLoggedIn = Boolean(authKey);

    // Redirect trainers away from the member timetable.
    useEffect(() => {
        if (user?.role === "trainer") {
            navigate("/session", {
                replace: true,
            });
        }
    }, [user, navigate]);

    // Load timetable sessions and apply the search filter.
    const getSessions = useCallback(() => {
        const request =
            filter.length > 0
                ? fetchAPI("GET", "/session?filter=" + encodeURIComponent(filter))
                : fetchAPI("GET", "/session");

        request
            .then((response) => {
                if (response.status === 200) {
                    if (Array.isArray(response.body) && response.body.length > 0) {
                        setSessions(response.body);
                        setError(null);
                    } else {
                        setSessions([]);
                        setError("No sessions found");
                    }
                } else {
                    setSessions([]);
                    setError(response.body?.message || "Failed to load sessions");
                }
            })
            .catch((error) => {
                setSessions([]);
                setError(error.message || String(error));
            });
    }, [filter]);

    useEffect(() => {
        getSessions();
    }, [getSessions]);

    // Load existing bookings for the authenticated member.
    useEffect(() => {
        if (!authKey || user?.role === "trainer") {
            setBookedSessionIds([]);
            return;
        }

        let isMounted = true;
        setIsLoadingBookings(true);

        fetchAPI("GET", "/booking", null, authKey)
            .then((response) => {
                if (!isMounted) {
                    return;
                }

                if (response.status === 200 && Array.isArray(response.body)) {
                    const ids = response.body
                        .map((booking) => booking.session_id ?? booking.sessionId)
                        .filter((id) => id !== undefined && id !== null)
                        .map(String);

                    setBookedSessionIds(ids);
                } else {
                    console.error(
                        "Failed to load bookings:",
                        response.body?.message || response.status
                    );
                }
            })
            .catch((error) => {
                console.error("Failed to load bookings:", error);
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoadingBookings(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [authKey, user?.role]);

    // Check whether the member has already booked a session.
    const hasBookedSession = (session) => {
        return bookedSessionIds.includes(String(session.session_id));
    };

    // Open the confirmation modal for an available session.
    const handleConfirm = (session) => {
        if (!localStorage.getItem("auth-key")) {
            navigate("/login");
            return;
        }

        if (hasBookedSession(session)) {
            return;
        }

        setBookingError(null);
        setSelectedSession(session);
    };

    // Close the booking confirmation modal.
    const handleCancel = () => {
        setSelectedSession(null);
        setBookingError(null);
    };

    // Submit the booking and immediately update the button status.
    const handleBookSession = () => {
        if (!selectedSession || isBooking) {
            return;
        }

        const currentAuthKey = localStorage.getItem("auth-key");

        if (!currentAuthKey) {
            navigate("/login");
            return;
        }

        if (hasBookedSession(selectedSession)) {
            setBookingError("You have already booked this session.");
            return;
        }

        setIsBooking(true);
        setBookingError(null);

        fetchAPI(
            "POST",
            "/booking",
            {
                sessionId: selectedSession.session_id,
            },
            currentAuthKey
        )
            .then((response) => {
                if (response.status === 200 || response.status === 201) {
                    const bookedId = String(selectedSession.session_id);

                    setBookedSessionIds((previousIds) =>
                        previousIds.includes(bookedId)
                            ? previousIds
                            : [...previousIds, bookedId]
                    );

                    setSelectedSession(null);
                    setBookingError(null);
                } else {
                    const message =
                        response.body?.message || "Failed to book session";

                    if (
                        message.toLowerCase().includes("already booked") ||
                        message.toLowerCase().includes("duplicate")
                    ) {
                        setBookedSessionIds((previousIds) => {
                            const bookedId = String(selectedSession.session_id);

                            return previousIds.includes(bookedId)
                                ? previousIds
                                : [...previousIds, bookedId];
                        });

                        setSelectedSession(null);
                    } else {
                        setBookingError(message);
                    }
                }
            })
            .catch((error) => {
                setBookingError(error.message || String(error));
            })
            .finally(() => {
                setIsBooking(false);
            });
    };

    return (
        <section className="flex flex-col items-center">
            {/* Search bar */}
            <div className="join p-4 self-stretch">
                <input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    type="text"
                    className="input join-item grow"
                    placeholder="Search sessions"
                />

                <button
                    onClick={getSessions}
                    className="btn join-item"
                    aria-label="Search sessions"
                >
                    <FaSearch />
                </button>
            </div>

            {/* Session loading and error messages */}
            {error && (
                <span className="p-4 self-center text-red-500">
                    {error}
                </span>
            )}

            {/* Timetable sessions */}
            {!error && sessions.length === 0 ? (
                <span className="loading loading-spinner loading-xl"></span>
            ) : (
                <ul className="list bg-base-100 self-stretch">
                    {sessions.map((session) => {
                        const alreadyBooked = hasBookedSession(session);

                        return (
                            <li
                                key={session.session_id}
                                className="list-row"
                            >
                                <div>
                                    <div className="font-bold">
                                        {session.activity_name}
                                    </div>

                                    <div className="text-xs uppercase font-semibold opacity-60">
                                        {session.location_name}
                                    </div>

                                    <div className="text-xs opacity-70">
                                        {session.date} ({session.weekday})
                                    </div>

                                    <div className="text-xs opacity-70">
                                        {session.start_time} - {session.end_time}
                                    </div>

                                    <div className="text-xs opacity-70">
                                        Trainer: {session.trainer_name}
                                    </div>

                                    <div className="text-xs opacity-70">
                                        Capacity: {session.capacity} people
                                    </div>
                                </div>

                                {user?.role !== "trainer" && (
                                    <button
                                        onClick={() => handleConfirm(session)}
                                        className={`btn ${alreadyBooked
                                            ? "btn-disabled"
                                            : "btn-primary btn-outline"
                                            }`}
                                        disabled={
                                            alreadyBooked ||
                                            isLoadingBookings
                                        }
                                    >
                                        {alreadyBooked
                                            ? "You Already Booked This Session"
                                            : isLoggedIn
                                                ? "Book Session"
                                                : "Login to Book"}
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {/* Booking confirmation modal */}
            {selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-[350px] rounded-2xl bg-base-100 p-5 shadow-xl">
                        <h3 className="font-bold text-lg">
                            Confirm Booking
                        </h3>

                        <p className="py-4">
                            Are you sure you want to book this session?
                        </p>

                        <div className="py-2">
                            <p className="font-bold">
                                {selectedSession.activity_name}
                            </p>

                            <p className="text-sm opacity-70">
                                {selectedSession.date} ({selectedSession.weekday})
                            </p>

                            <p className="text-sm opacity-70">
                                {selectedSession.start_time} - {selectedSession.end_time}
                            </p>

                            <p className="text-sm opacity-70">
                                Location: {selectedSession.location_name}
                            </p>

                            <p className="text-sm opacity-70">
                                Trainer: {selectedSession.trainer_name}
                            </p>

                            <p className="text-sm opacity-70">
                                Capacity: {selectedSession.capacity} people
                            </p>
                        </div>

                        {/* Booking error */}
                        {bookingError && (
                            <p className="text-error font-semibold text-sm py-2">
                                {bookingError}
                            </p>
                        )}

                        <div className="modal-action">
                            <button
                                className="btn btn-outline"
                                onClick={handleCancel}
                                disabled={isBooking}
                            >
                                Cancel
                            </button>

                            <button
                                className="btn btn-primary"
                                onClick={handleBookSession}
                                disabled={isBooking}
                            >
                                {isBooking ? (
                                    <span className="loading loading-spinner"></span>
                                ) : (
                                    "Confirm Booking"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default TimetableView;
