import {  FaSearch, FaSellsy } from "react-icons/fa";
import { useNavigate } from "react-router";
import { useCallback, useEffect, useState } from "react";
import { fetchAPI } from "../api.mjs";

function Timetable() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");

  const getSessions = useCallback(
    (filter = "") => {
      setSessions([]);
      setError(null);
      const request =
        filter.length > 0
          ? fetchAPI("GET", "/sessions?filter=" + filter)
          : fetchAPI("GET", "/sessions");

      request
        .then((response) => {
          if (response.status == 200) {
            if (response.body.length > 0) {
              setSessions(response.body);
              setError(null);
            } else {
              setSessions([]);
              setError("No results found");
            }
          } else {
            setError(response.body.message);
          }
        })
        .catch((error) => {
          setError(error);
        });
    },
    [setSessions, setError],
  );

  useEffect(() => {
    getSessions();
  }, [getSessions]);

  return (
    <section className="flex flex-col items-center">
      <div className="join p-4 self-stretch">
        <input
          onChange={(e) => setFilter(e.target.value)}
          value={filter}
          className="input join-item grow"
          placeholder="search sessions"
          type="text"
        />
        <button onClick={() => getSessions(filter)} className="btn join-item">
          <FaSearch />
        </button>
      </div>
      {error && <span className="p-4">{error}</span>}
      {!error && sessions.length == 0 ? (
        <span className="loading loading-spinner loading-xl"></span>
      ) : (
        <ul className="list self-stretch">
          {sessions.map((session) => (
            <li key={session.id} className="list-row">
               <div>
                    <div>
                    Trainer: {session.first_name} {session.last_name}
                    </div>

                    <div>
                    Location: {session.location_name}
                    </div>

                    <div>
                    Activity: {session.activity_name}
                    </div>
                    <div>
                    Date: {session.date}
                    </div>
                    <div>
                    Start Time: {session.start_time}
                    </div>
                    <div>
                    End Time: {session.end_time}
                    </div>

                </div>

              <button
                onClick={() => navigate("/sessions/" + session.id)}
                className="btn btn-ghost text-xl"
              >
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
