import { FaSearch } from "react-icons/fa";
import { useCallback, useEffect, useState } from "react";
import { fetchAPI } from "../api.mjs";

function Timetable() {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const getSessions = useCallback(() => {
    setError(null);
    setLoading(true);

    fetchAPI("GET", "/api/sessions")
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

  return (
    <section className="p-4">

      <div className="flex gap-2 mb-4">
        <input
          className="border p-2"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="search sessions"
        />

        <button onClick={getSessions} className="btn">
          <FaSearch />
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {loading ? (
        <p>Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <p>No sessions found</p>
      ) : (
        <ul>
          {sessions.map((s) => (
            <li key={s.id} className="border p-3 my-2">

              <div>Session ID: {s.id}</div>

              <div>Trainer: {s.trainer_name}</div>
              <div>Activity: {s.activity_name}</div>
              <div>Location: {s.location_name}</div>

              <div>Date: {s.date}</div>
              <div>Start: {s.start_time}</div>
              <div>End: {s.end_time}</div>

              <button className="btn">
                Book now
              </button>

            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default Timetable;