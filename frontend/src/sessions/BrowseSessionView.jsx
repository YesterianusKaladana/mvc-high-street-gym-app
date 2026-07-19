import { FaSearch } from "react-icons/fa";
import { CiLogin } from "react-icons/ci";
import { useNavigate } from "react-router";
import { useCallback, useEffect, useState } from "react";
import { fetchAPI } from "../api.mjs";

function BrowseSessionView() {
    const navigate = useNavigate();

    const [sessions, setSessions] = useState([]);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const getSessions = useCallback(async (search = "") => {
        try {
            setIsLoading(true);
            setError(null);

            const authKey = localStorage.getItem("authKey");

            const url =
                search.trim()
                    ? `/session?filter=${encodeURIComponent(search)}`
                    : "/session";

            const response = await fetchAPI("GET", url, null, authKey);

            if (response.status !== 200) {
                throw new Error(response.body?.message || "Error loading sessions");
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
                                onClick={() => navigate("/login")}
                            >
                                Book
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export default BrowseSessionView;