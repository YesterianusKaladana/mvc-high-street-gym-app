import { useCallback, useEffect, useState } from "react"
import { FaSearch } from "react-icons/fa"
import { fetchAPI } from "../api.mjs"
import { useNavigate } from "react-router"
import { useAuthenticate } from "../authentication/UseAuthenticate"

function TimetableView() {
    const [filter, setFilter] = useState("")
    const [sessions, setSessions] = useState([])
    const [error, setError] = useState(null)
    const navigate = useNavigate()
    const { user } = useAuthenticate()

    const isLoggedIn = Boolean(localStorage.getItem("auth-key"))

    //Redirect trainer away from member timetable
    useEffect(() => {
        if (user?.role === "trainer") {
            navigate("/session", {
                replace: true
            })

        }
    }, [user, navigate])

    const getSessions = useCallback(() => {
        const request = filter.length > 0
            ? fetchAPI("GET", "/session?filter=" + filter)
            : fetchAPI("GET", "/session")

        request
            .then(response => {
                if (response.status == 200) {
                    if (response.body.length > 0) {
                        setSessions(response.body)
                        setError(null)
                    } else {
                        setSessions([])
                        setError("No results")
                    }
                } else {
                    setError(response.body.message)
                }
            })
            .catch(error => {
                setError(error.message || String(error))
            })
    }, [filter])

    useEffect(() => {
        getSessions()
    }, [getSessions])

    const handleConfirm = session => {
        const authKey = localStorage.getItem("auth-key")

        if (!authKey) {
            navigate("/login")
            return
        }

        setSelectedSession(session)
    }

    const [selectedSession, setSelectedSession] = useState(null)
    const [isBooking, setIsBooking] = useState(false)

    const handleCancel = () => {
        setSelectedSession(null)
    }

    const handleBookSession = () => {
        if (!selectedSession) {
            return
        }

        const authKey = localStorage.getItem("auth-key")

        if (!authKey) {
            navigate("/login")
            return
        }

        setIsBooking(true)

        fetchAPI(
            "POST",
            "/booking",
            {
                sessionId: selectedSession.session_id
            },
            authKey
        )
            .then(response => {
                if (response.status == 200 || response.status == 201) {
                    setSelectedSession(null)
                    navigate("/booking")
                } else {
                    setError(response.body.message)
                }
            })
            .catch(error => {
                setError(error.message || String(error))
            })
            .finally(() => {
                setIsBooking(false)
            })
    }

    return (
        <section className="flex flex-col items-center">

            {/* SEARCH BAR */}
            <div className="join p-4 self-stretch">
                <input
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    type="text"
                    className="input join-item grow"
                    placeholder="search sessions"
                />

                <button
                    onClick={() => getSessions()}
                    className="btn join-item"
                >
                    <FaSearch />
                </button>
            </div>

            {/* ERROR */}
            {error && (
                <span className="p-4 self-center text-red-500">
                    {error}
                </span>
            )}

            {/* SESSIONS */}
            {!error && sessions.length == 0
                ? (
                    <span className="loading loading-spinner loading-xl"></span>
                )
                : (
                    <ul className="list bg-base-100 self-stretch">
                        {sessions.map(session =>
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
                                        className="btn btn-primary btn-outline"
                                    >
                                        {isLoggedIn
                                            ? "Book Session"
                                            : "Login to Book"}
                                    </button>
                                )}

                            </li>
                        )}
                    </ul>
                )
            }

            {/* BOOKING MODAL */}
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
                                {isBooking
                                    ? <span className="loading loading-spinner"></span>
                                    : "Confirm Booking"
                                }
                            </button>

                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

export default TimetableView