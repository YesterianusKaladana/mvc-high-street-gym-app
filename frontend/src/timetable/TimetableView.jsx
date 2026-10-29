
import { useCallback, useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
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

    const navigate = useNavigate();
    const { user } = useAuthenticate();
    const authKey = localStorage.getItem("auth-key");
    const isLoggedIn = Boolean(authKey);

    // Redirect trainers to the session management page.
    useEffect(() => {
        if (user?.role === "trainer") {
            navigate("/session", { replace: true });
        }
    }, [user, navigate]);

    // Load sessions from the API using the search filter.
    const getSessions = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const url = filter.trim()
                ? "/session?filter=" + encodeURIComponent(filter)
                : "/session";

            const response = await fetchAPI("GET", url);

            if (response.status !== 200) {
                throw new Error(
                    response.body?.message || "Failed to load sessions"
                );
            }

            if (Array.isArray(response.body)) {
                setSessions(response.body);

                if (response.body.length === 0) {
                    setError("No sessions found");
                }
            } else {
                setSessions([]);
                setError("Invalid session response from the server");
            }
        } catch (error) {
            setSessions([]);
            setError(error.message || String(error));
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    // Load sessions when the page opens or the search changes.
    useEffect(() => {
        getSessions();
    }, [getSessions]);

    // Load the current member's bookings from the API.
    useEffect(() => {
        if (!authKey || user?.role === "trainer") {
            setBookedSessionIds([]);
            setIsLoadingBookings(false);
            return;
        }

        let isMounted = true;

        const getBookings = async () => {
            try {
                setIsLoadingBookings(true);

                const response = await fetchAPI("GET", "/booking", null, authKey);

                if (!isMounted) {
                    return;
                }

                if (response.status === 200 && Array.isArray(response.body)) {
                    // Extract each booked session ID from the booking response.
                    const ids = response.body
                        .map((booking) =>
                            booking.session_id ??
                            booking.sessionId ??
                            booking.session?.session_id
                        )
                        .filter((id) => id !== undefined && id !== null)
                        .map(String);

                    setBookedSessionIds([...new Set(ids)]);
                } else {
                    console.error(
                        "Failed to load bookings:",
                        response.body?.message || response.status
                    );
                }
            } catch (error) {
                if (isMounted) {
                    console.error("Failed to load bookings:", error);
                }
            } finally {
                if (isMounted) {
                    setIsLoadingBookings(false);
                }
            }
        };

        getBookings();

        // Prevent state updates after leaving the page.
        return () => {
            isMounted = false;
        };
    }, [authKey, user?.role]);

    // Check whether the current member has booked a session.
    const hasBookedSession = (session) => {
        return bookedSessionIds.includes(String(session.session_id));
    };

    // Open the confirmation modal or redirect to login.
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

    // Close the confirmation modal and clear its error.
    const handleCancel = () => {
        setSelectedSession(null);
        setBookingError(null);
    };

    // Book the selected session and update the timetable.
    const handleBookSession = async () => {
        if (!selectedSession || isBooking) {
            return;
        }

        const currentAuthKey = localStorage.getItem("auth-key");

        if (!currentAuthKey) {
            navigate("/login");
            return;
        }

        const bookedId = String(selectedSession.session_id);

        // Prevent duplicate booking requests from this page.
        if (hasBookedSession(selectedSession)) {
            setBookingError("You have already booked this session.");
            return;
        }

        try {
            setIsBooking(true);
            setBookingError(null);
            setBookingSuccess(null);

            const response = await fetchAPI("POST", "/booking", {
                sessionId: selectedSession.session_id
            }, currentAuthKey);

            if (response.status === 200 || response.status === 201) {
                // Immediately mark this session as booked.
                setBookedSessionIds((previousIds) =>
                    previousIds.includes(bookedId)
                        ? previousIds
                        : [...previousIds, bookedId]
                );

                setSelectedSession(null);
                setBookingSuccess("Booking confirmed successfully!");
            } else {
                const message =
                    response.body?.message || "Failed to book session";

                // Handle a booking that already exists in the database.
                if (
                    message.toLowerCase().includes("already booked") ||
                    message.toLowerCase().includes("duplicate")
                ) {
                    setBookedSessionIds((previousIds) =>
                        previousIds.includes(bookedId)
                            ? previousIds
                            : [...previousIds, bookedId]
                    );

                    setBookingError("You have already booked this session.");
                } else {
                    setBookingError(message);
                }
            }
        } catch (error) {
            setBookingError(error.message || String(error));
        } finally {
            setIsBooking(false);
        }
    };

    return (
        <section className="flex flex-col items-center">
            {/* Search bar for finding sessions. */}
            <div className="join p-4 self-stretch">
                <input
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            getSessions();
                        }
                    }}
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

            {/* Display the result of a successful booking. */}
            {bookingSuccess && (
                <div className="alert alert-success mx-4 mb-4 w-auto self-stretch">
                    <span>{bookingSuccess}</span>
                </div>
            )}

            {/* Display a duplicate-booking message when necessary. */}
            {bookingError && !selectedSession && (
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

            {/* Display the available sessions. */}
            {!isLoading && !error && sessions.length > 0 && (
                <ul className="list bg-base-100 self-stretch">
                    {sessions.map((session) => {
                        const alreadyBooked = hasBookedSession(session);

                        return (
                            <li key={session.session_id} className="list-row">
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

                                {/* Members can book sessions; trainers are redirected. */}
                                {user?.role !== "trainer" && (
                                    <button
                                        onClick={() => handleConfirm(session)}
                                        className={`btn ${alreadyBooked
                                            ? "btn-disabled"
                                            : "btn-primary btn-outline"
                                            }`}
                                        disabled={
                                            alreadyBooked || isLoadingBookings
                                        }
                                    >
                                        {alreadyBooked
                                            ? "You Already Booked This Session"
                                            : isLoadingBookings
                                                ? "Checking Bookings..."
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

            {/* Booking confirmation modal. */}
            {selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-[350px] rounded-2xl bg-base-100 p-5 shadow-xl">
                        <h3 className="font-bold text-lg">Confirm Booking</h3>

                        <p className="py-4">
                            Are you sure you want to book this session?
                        </p>

                        {/* Show the selected session details. */}
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

                        {/* Display booking errors inside the modal. */}
                        {bookingError && selectedSession && (
                            <p className="text-error font-semibold text-sm py-2">
                                {bookingError}
                            </p>
                        )}

                        {/* Cancel or confirm the booking. */}
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
