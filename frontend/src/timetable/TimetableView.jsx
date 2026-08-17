import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router";
import { useCallback, useEffect, useState } from "react";
import { fetchAPI } from "../api.mjs";

function TimetableView() {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Session selected for booking
    const [selectedSession, setSelectedSession] = useState(null);
    const [isBooking, setIsBooking] = useState(false);

    const getSessions = useCallback(async (search = "") => {
        try {
            setIsLoading(true);
            setError(null);

            const authKey = localStorage.getItem("auth-key");

            const url =
                search.trim()
                    ? `/session?filter=${encodeURIComponent(search)}`
                    : "/session";

            const response = await fetchAPI("GET", url, null, authKey);

            if (response.status !== 200) {
                throw new Error(
                    response.body?.message || "Error loading sessions"
                );
            }

            const data = response.body;

            if (!Array.isArray(data)) {
                throw new Error("Invalid response format");
            }

            setSessions(data);
        } catch (err) {
            setError(err.message || String(err));
            setSessions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        getSessions();
    }, [getSessions]);

    const handleSearch = () => {
        getSessions(filter);
    };

    // Open the confirmation box
    const handleConfirm = (session) => {
        setSelectedSession(session);
        setError(null);
    };

    // Cancel the booking
    const handleCancel = () => {
        setSelectedSession(null);
        setError(null);
    };

    // Confirm and create the booking
    const handleBookSession = async () => {
        if (!selectedSession) {
            return;
        }

        try {
            setIsBooking(true);
            setError(null);

            const authKey = localStorage.getItem("auth-key");

            const response = await fetchAPI(
                "POST",
                "/booking",
                {
                    sessionId: selectedSession.session_id
                },
                authKey
            );

            if (response.status !== 200 && response.status !== 201) {
                throw new Error(
                    response.body?.message || "Unable to book session"
                );
            }

            // Close confirmation box
            setSelectedSession(null);

            // Optional success message
            alert("Session booked successfully!");

        } catch (err) {
            setError(err.message || String(err));
        } finally {
            setIsBooking(false);
        }
    };

    return (
        <section className="flex flex-col items-center">

            {/* SEARCH BAR */}
            <div className="join p-4 self-stretch">
                <input
                    onChange={(e) => setFilter(e.target.value)}
                    value={filter}
                    className="input join-item grow"
                    placeholder="Search sessions..."
                    type="text"
                />

                <button onClick={handleSearch} className="btn join-item">
                    <FaSearch />
                </button>
            </div>

            {/* ERROR */}
            {error && (
                <span className="p-4 text-red-500 font-semibold">
                    {error}
                </span>
            )}

            {/* LOADING */}
            {isLoading ? (
                <span className="loading loading-spinner loading-xl"></span>
            ) : sessions.length === 0 ? (
                <p className="p-4 opacity-60">No sessions available</p>
            ) : (
                <ul className="list self-stretch">
                    {sessions.map((session) => (
                        <li key={session.session_id} className="list-row">

                            <div>
                                <div className="font-bold">
                                    {session.activity_name}
                                </div>

                                <div className="text-xs uppercase opacity-60 font-semibold">
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

                            <button
                                className="text-sm btn btn-primary btn-outline"
                                onClick={() => handleConfirm(session)}
                            >
                                Book Session
                            </button>

                        </li>
                    ))}
                </ul>
            )}

            {/* BOOKING CONFIRMATION */}
            {selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-[400px] max-h-[90vh] overflow-y-auto rounded-2xl bg-base-100 p-5 shadow-xl">

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
                                {selectedSession.date} (
                                {selectedSession.weekday})
                            </p>

                            <p className="text-sm opacity-70">
                                {selectedSession.start_time} -{" "}
                                {selectedSession.end_time}
                            </p>

                            <p className="text-sm opacity-70">
                                Location: {selectedSession.location_name}
                            </p>

                            <p className="text-sm opacity-70">
                                Trainer: {selectedSession.trainer_name}
                            </p>
                        </div>

                        <div className="modal-action">

                            {/* CANCEL */}
                            <button
                                className="btn btn-outline"
                                onClick={handleCancel}
                                disabled={isBooking}
                            >
                                Cancel
                            </button>

                            {/* CONFIRM */}
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