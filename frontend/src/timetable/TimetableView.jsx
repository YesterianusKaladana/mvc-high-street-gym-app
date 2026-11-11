import { useCallback, useEffect, useState } from "react";
import { FaSearch, FaTrash } from "react-icons/fa";
import { fetchAPI } from "../api.mjs";
import { useNavigate } from "react-router";
import { useAuthenticate } from "../authentication/UseAuthenticate";

function TimetableView() {
    const [filter, setFilter] = useState("");
    const [sessions, setSessions] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [isBooking, setIsBooking] = useState(false);
    const [bookingError, setBookingError] = useState(null);
    const [bookingSuccess, setBookingSuccess] = useState(null);
    const [bookedSessionIds, setBookedSessionIds] = useState([]);
    const [isLoadingBookings, setIsLoadingBookings] = useState(false);
    const [selectedCancelSession, setSelectedCancelSession] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);

    const navigate = useNavigate();
    const { user } = useAuthenticate();
    const authKey = localStorage.getItem("auth-key");
    const isTrainer = user?.role === "trainer";
    const isMember = user?.role === "member";

    // Load sessions from the API.
    const getSessions = useCallback(
        (searchFilter = "") => {
            setIsLoading(true);
            setError(null);

            const request = searchFilter.trim()
                ? fetchAPI("GET", "/session?filter=" + searchFilter.trim())
                : fetchAPI("GET", "/session");

            request
                .then((response) => {
                    if (response.status === 200 && Array.isArray(response.body)) {
                        // Trainers can only see their own sessions.
                        const userSessions = isTrainer
                            ? response.body.filter(
                                (session) =>
                                    Number(session.session_user_id) === Number(user?.id),
                            )
                            : response.body;

                        setSessions(userSessions);

                        if (userSessions.length === 0) {
                            setError("No sessions found");
                        }
                    } else {
                        setSessions([]);
                        setError(response.body?.message || "Failed to load sessions.");
                    }

                    setIsLoading(false);
                })
                .catch((error) => {
                    setSessions([]);
                    setError(error.message || String(error));
                    setIsLoading(false);
                });
        },
        [isTrainer, user?.id],
    );

    // Load sessions when the page opens or the user role becomes available.
    useEffect(() => {
        getSessions(filter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getSessions]);

    // Load the current member's bookings from the API.
    useEffect(() => {
        if (!authKey || !isMember) {
            setBookedSessionIds([]);
            setIsLoadingBookings(false);
            return;
        }

        let isMounted = true;
        setIsLoadingBookings(true);

        fetchAPI("GET", "/booking", null, authKey)
            .then((response) => {
                if (!isMounted) return;

                if (response.status === 200 && Array.isArray(response.body)) {
                    const ids = response.body
                        .map(
                            (booking) =>
                                booking.session_id ??
                                booking.sessionId ??
                                booking.session?.session_id,
                        )
                        .filter((id) => id !== undefined && id !== null)
                        .map(String);

                    setBookedSessionIds([...new Set(ids)]);
                } else {
                    console.error(
                        "Failed to load bookings:",
                        response.body?.message || response.status,
                    );
                }

                setIsLoadingBookings(false);
            })
            .catch((error) => {
                if (isMounted) {
                    console.error("Failed to load bookings:", error);
                    setIsLoadingBookings(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [authKey, isMember]);

    // Check whether the current member has booked a session.
    const hasBookedSession = (session) => {
        return bookedSessionIds.includes(String(session.session_id));
    };

    // Open the booking confirmation modal or redirect to login.
    const handleConfirm = (session) => {
        if (!localStorage.getItem("auth-key")) {
            navigate("/login");
            return;
        }

        if (hasBookedSession(session)) {
            setBookingSuccess(null);
            setBookingError("You have already booked this session.");
            return;
        }

        setBookingError(null);
        setBookingSuccess(null);
        setSelectedSession(session);
    };

    // Close the booking confirmation modal.
    const handleCancel = () => {
        setSelectedSession(null);
        setBookingError(null);
    };

    // Book the selected session.
    const handleBookSession = () => {
        if (!selectedSession || isBooking) return;

        const currentAuthKey = localStorage.getItem("auth-key");

        if (!currentAuthKey) {
            navigate("/login");
            return;
        }

        const bookedId = String(selectedSession.session_id);

        if (hasBookedSession(selectedSession)) {
            setBookingError("You have already booked this session.");
            return;
        }

        setIsBooking(true);
        setBookingError(null);
        setBookingSuccess(null);

        fetchAPI(
            "POST",
            "/booking",
            {
                sessionId: selectedSession.session_id,
            },
            currentAuthKey,
        )
            .then((response) => {
                if (response.status === 200 || response.status === 201) {
                    setBookedSessionIds((previousIds) =>
                        previousIds.includes(bookedId)
                            ? previousIds
                            : [...previousIds, bookedId],
                    );

                    setSelectedSession(null);
                    setBookingSuccess("Booking confirmed successfully!");
                } else {
                    const message = response.body?.message || "Failed to book session";

                    if (
                        message.toLowerCase().includes("already booked") ||
                        message.toLowerCase().includes("duplicate")
                    ) {
                        setBookedSessionIds((previousIds) =>
                            previousIds.includes(bookedId)
                                ? previousIds
                                : [...previousIds, bookedId],
                        );

                        setBookingError("You have already booked this session.");
                    } else {
                        setBookingError(message);
                    }
                }

                setIsBooking(false);
            })
            .catch((error) => {
                setBookingError(error.message || String(error));
                setIsBooking(false);
            });
    };

    // Open the session cancellation confirmation modal.
    const handleConfirmCancel = (session) => {
        setBookingError(null);
        setBookingSuccess(null);
        setSelectedCancelSession(session);
    };

    // Close the session cancellation confirmation modal.
    const handleCloseCancel = () => {
        setSelectedCancelSession(null);
        setBookingError(null);
    };

    // Cancel the selected trainer session.
    const handleCancelSession = () => {
        if (!selectedCancelSession || isCancelling) return;

        const currentAuthKey = localStorage.getItem("auth-key");

        if (!currentAuthKey) {
            navigate("/login");
            return;
        }

        setIsCancelling(true);
        setBookingError(null);
        setBookingSuccess(null);

        fetchAPI(
            "DELETE",
            `/session/${selectedCancelSession.session_id}`,
            null,
            currentAuthKey,
        )
            .then((response) => {
                if (response.status === 200 || response.status === 204) {
                    setSessions((previousSessions) =>
                        previousSessions.filter(
                            (session) =>
                                String(session.session_id) !==
                                String(selectedCancelSession.session_id),
                        ),
                    );

                    setSelectedCancelSession(null);
                    setBookingSuccess("Session cancelled successfully.");
                } else {
                    setBookingError(
                        response.body?.message || "Failed to cancel the session.",
                    );
                }

                setIsCancelling(false);
            })
            .catch((error) => {
                setBookingError(error.message || String(error));
                setIsCancelling(false);
            });
    };

    return (
        <section className="flex flex-col items-center">
            {/* Search bar for finding sessions by activity name. */}
            <div className="join p-4 self-stretch">
                <input
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            getSessions(filter);
                        }
                    }}
                    type="text"
                    className="input join-item grow"
                    placeholder="Search by activity name"
                />

                <button
                    onClick={() => getSessions(filter)}
                    className="btn join-item"
                    aria-label="Search sessions"
                >
                    <FaSearch />
                </button>
            </div>

            {/* Display successful booking or cancellation messages. */}
            {bookingSuccess && (
                <div className="alert alert-success mx-4 mb-4 w-auto self-stretch">
                    <span>{bookingSuccess}</span>
                </div>
            )}

            {/* Display booking or cancellation errors. */}
            {bookingError && !selectedSession && !selectedCancelSession && (
                <div className="alert alert-warning mx-4 mb-4 w-auto self-stretch">
                    <span>{bookingError}</span>
                </div>
            )}

            {/* Show a spinner while sessions are loading. */}
            {isLoading && (
                <span className="loading loading-spinner loading-xl"></span>
            )}

            {/* Display an error if sessions cannot be loaded. */}
            {!isLoading && error && (
                <span className="p-4 self-center text-error">{error}</span>
            )}

            {/* Display the sessions. */}
            {!isLoading && !error && sessions.length > 0 && (
                <ul className="list bg-base-100 self-stretch">
                    {sessions.map((session) => {
                        const alreadyBooked = hasBookedSession(session);

                        return (
                            <li
                                key={session.session_id}
                                className="list-row border border-blue-300 rounded-xl shadow-sm mb-3 items-center"
                            >
                                <div>
                                    <div className="font-bold">{session.activity_name}</div>

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

                                {/* Trainers can cancel their own sessions. */}
                                {isTrainer && (
                                    <button
                                        onClick={() => handleConfirmCancel(session)}
                                        className="btn btn-error"
                                    >
                                        <FaTrash />
                                        Cancel Session
                                    </button>
                                )}

                                {/* Members can book available sessions. */}
                                {isMember && (
                                    <button
                                        onClick={() => handleConfirm(session)}
                                        className={`btn ${alreadyBooked ? "btn-disabled" : "btn-primary"
                                            }`}
                                        disabled={alreadyBooked || isLoadingBookings}
                                    >
                                        {alreadyBooked
                                            ? "You Already Booked This Session"
                                            : isLoadingBookings
                                                ? "Checking Bookings..."
                                                : "Book Session"}
                                    </button>
                                )}

                                {/* Guests can log in to book sessions. */}
                                {!user && (
                                    <button
                                        onClick={() => handleConfirm(session)}
                                        className="btn btn-primary"
                                    >
                                        Login to Book
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {/* Booking confirmation modal. */}
            {selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-[350px] rounded-2xl bg-base-100 p-5 shadow-xl">
                        <h3 className="font-bold text-lg">Confirm Booking</h3>

                        <p className="py-4">Are you sure you want to book this session?</p>

                        <div className="py-2">
                            <p className="font-bold">{selectedSession.activity_name}</p>
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

            {/* Trainer session cancellation confirmation modal. */}
            {selectedCancelSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-[350px] rounded-2xl bg-base-100 p-5 shadow-xl">
                        <h3 className="font-bold text-lg">Confirm Session Cancellation</h3>

                        <p className="py-4">
                            Are you sure you want to cancel this session?
                        </p>

                        <div className="py-2">
                            <p className="font-bold">{selectedCancelSession.activity_name}</p>
                            <p className="text-sm opacity-70">{selectedCancelSession.date}</p>
                            <p className="text-sm opacity-70">
                                {selectedCancelSession.start_time} -{" "}
                                {selectedCancelSession.end_time}
                            </p>
                            <p className="text-sm opacity-70">
                                Location: {selectedCancelSession.location_name}
                            </p>
                        </div>

                        {bookingError && (
                            <p className="text-error font-semibold text-sm py-2">
                                {bookingError}
                            </p>
                        )}

                        <div className="modal-action">
                            <button
                                className="btn btn-outline"
                                onClick={handleCloseCancel}
                                disabled={isCancelling}
                            >
                                Cancel
                            </button>

                            <button
                                className="btn btn-error"
                                onClick={handleCancelSession}
                                disabled={isCancelling}
                            >
                                {isCancelling ? (
                                    <span className="loading loading-spinner"></span>
                                ) : (
                                    "Confirm Cancellation"
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
