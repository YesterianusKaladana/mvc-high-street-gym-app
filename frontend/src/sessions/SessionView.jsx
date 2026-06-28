import { FaSearch } from "react-icons/fa";
import { CiLogin } from "react-icons/ci";
import { useNavigate } from "react-router";
import { useCallback, useEffect, useState } from "react";
import { fetchAPI } from "../api.mjs";

function SessionView() {
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
        search.trim().length > 0
          ? `/session/?filter=${search}`
          : "/session/";

      const response = await fetchAPI("GET", url, null, authKey);

      if (response.status !== 200) {
        throw new Error(response.body?.message || "Error loading sessions");
      }

      const data = response.body;

      if (!Array.isArray(data) || data.length === 0) {
        setSessions([]);
        setError("No sessions found");
        return;
      }

      setSessions(data);
    } catch (err) {
      setError(String(err.message || err));
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
          placeholder="search sessions"
          type="text"
        />

        <button onClick={handleSearch} className="btn join-item">
          <FaSearch />
        </button>

        <button
          className="btn join-item btn-primary flex items-center gap-2"
          onClick={() => navigate("/login")}
        >
          <CiLogin />
        </button>
      </div>

      {/* ERROR */}
      {error && <span className="p-4 text-red-500">{error}</span>}

      {/* LOADING */}
      {isLoading ? (
        <span className="loading loading-spinner loading-xl"></span>
      ) : (
        <ul className="list self-stretch">
          {sessions.map((session) => (
            <li key={session.session_id} className="list-row">
              <div>
                <FaSearch className="size-10" />
              </div>

              <div>
                <div className="font-bold">{session.activity_name}</div>

                <div className="text-xs uppercase opacity-60 font-semibold">
                  {session.location_name}
                </div>

                <div className="text-xs opacity-70">
                  {session.date} | {session.start_time} - {session.end_time}
                </div>

                <div className="text-xs opacity-70">
                  Trainer: {session.trainer_name}
                </div>
              </div>

              <button className="btn btn-ghost text-xl">
                Book
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default SessionView;