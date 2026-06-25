import { FaSearch } from "react-icons/fa";
import { CiLogin } from "react-icons/ci";
import { useCallback, useEffect, useState } from "react";
import { fetchAPI } from "../api.mjs";
import { useNavigate } from "react-router";

function Timetable() {
    const [sessions, setSessions] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");
    const navigate = useNavigate();

    const getSessions = useCallback(() => {
        setError(null);
        setLoading(true);

        const authKey = localStorage.getItem("authKey");

        fetchAPI("GET", "/session/", null, authKey)
            .then((res) => {
                if (res.status === 200) {
                    setSessions(res.body || []);
                } else {
                    setError(res.body?.message || "Error loading sessions");
                }
            })
            .catch((err) => setError(String(err)))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        getSessions();
    }, [getSessions]);

    const filteredSessions = sessions.filter(
        (s) =>
            s.activity_name?.toLowerCase().includes(filter.toLowerCase()) ||
            s.trainer_name?.toLowerCase().includes(filter.toLowerCase()) ||
            s.location_name?.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <section className="flex flex-col items-center p-6 min-h-screen bg-b-200">
            <div className="w-full max-w-4xl">

               {/* Header / Navbar */}
                <div className="w-full flex justify-between items-center mb-6">

                    {/* Left side - Title */}
                    <h2 className="text-3xl font-bold">
                        Sessions
                    </h2>

                    {/* Right side - Login */}
                    <button
                        className="btn btn-primary flex items-center gap-2 hover:scale-105 transition"
                        onClick={() => navigate("/login")}
                    >
                        <CiLogin className="text-xl" />
                        Login
                    </button>

                </div>

                <div className="flex gap-2 mb-6">
                    <input
                        className="input input-bordered w-full"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="Search sessions..."
                    />

                    <button
                        onClick={getSessions}
                        className="btn btn-primary"
                    >
                        <FaSearch />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : filteredSessions.length === 0 ? (
                    <p>No sessions found.</p>
                ) : (
                    <ul className="space-y-4">
                        {filteredSessions.map((session) => (
                            <li
                                key={session.id}
                                className="p-4 bg-white rounded-xl shadow"
                            >
                                <h3 className="text-xl font-bold">
                                    {session.activity_name}
                                </h3>

                                <p className="text-sm text-gray-500">
                                    Session ID: {session.id}
                                </p>

                                <div className="mt-2 space-y-1">
                                    <p>
                                        <strong>Trainer:</strong>{" "}
                                        {session.trainer_name}
                                    </p>

                                    <p>
                                        <strong>Location:</strong>{" "}
                                        {session.location_name}
                                    </p>

                                    <p>
                                        <strong>Date:</strong>{" "}
                                        {session.date}
                                    </p>

                                    <p>
                                        <strong>Time:</strong>{" "}
                                        {session.start_time} - {session.end_time}
                                    </p>
                                </div>

                                <button className="btn btn-primary mt-4">
                                    Book Now
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}

export default Timetable;