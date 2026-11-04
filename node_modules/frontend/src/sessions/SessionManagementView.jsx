
import { useState, useEffect, useCallback } from "react";
import {
  FaPerson,
  FaLocationDot,
  FaCalendarDays,
  FaClock,
  FaUsers,
} from "react-icons/fa6";
import { FaSearch, FaTrash, FaTimes } from "react-icons/fa";
import { fetchAPI } from "../api.mjs";
import { useAuthenticate } from "../authentication/UseAuthenticate";

function SessionManagementView() {
  const { user, status } = useAuthenticate("trainer");

  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Hide success messages after 2 seconds.
  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess(null);
    }, 2000);

    return () => clearTimeout(timer);
  }, [success]);

  // Fetch trainer sessions and filter the results.
  const getSessions = useCallback((searchFilter = "") => {
    const authKey = localStorage.getItem("auth-key");

    if (!authKey) {
      setSessions([]);
      setError("Please log in to view your sessions.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchAPI("GET", "/session/trainer", null, authKey)
      .then((response) => {
        if (response.status == 200) {
          const allSessions = Array.isArray(response.body)
            ? response.body
            : [];

          const searchTerm = searchFilter.trim().toLowerCase();

          const filteredSessions = searchTerm
            ? allSessions.filter((session) =>
              [
                session.activity_name,
                session.location_name,
                session.trainer_name,
                session.date,
                session.start_time,
                session.end_time,
                session.capacity,
              ].some((value) =>
                String(value ?? "")
                  .toLowerCase()
                  .includes(searchTerm),
              ),
            )
            : allSessions;

          setSessions(filteredSessions);

          if (filteredSessions.length === 0 && searchTerm) {
            setError("No results found.");
          }
        } else {
          setSessions([]);
          setError(response.body?.message || "Failed to load sessions.");
        }

        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load sessions:", err);
        setSessions([]);
        setError(err.message || String(err));
        setIsLoading(false);
      });
  }, []);

  // Load sessions when the component mounts.
  useEffect(() => {
    getSessions();
  }, [getSessions]);

  // Delete a session after confirmation.
  const handleDelete = (session) => {
    const authKey = localStorage.getItem("auth-key");

    if (!authKey) {
      setError("Please log in to manage your sessions.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this session?")) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    fetchAPI("DELETE", `/session/trainer/${session.session_id}`, null, authKey)
      .then((response) => {
        if (response.status == 200 || response.status == 204) {
          setSuccess("Session deleted successfully.");
          getSessions(filter);
        } else {
          setError(response.body?.message || "Failed to delete the session.");
        }

        setIsSaving(false);
      })
      .catch((err) => {
        console.error("Failed to delete session:", err);
        setError(err.message || String(err));
        setIsSaving(false);
      });
  };

  // Format dates and times for display.
  const formatDate = (date) =>
    date ? String(date).substring(0, 10) : "Not set";

  const formatTime = (time) =>
    time ? String(time).substring(0, 5) : "Not set";

  return (
    <section className="flex min-w-0 flex-col items-center">

      {/* Search sessions. */}
      <form
        className="join self-stretch p-4"
        onSubmit={(event) => {
          event.preventDefault();
          getSessions(filter);
        }}
      >
        <input
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="input input-bordered join-item grow"
          placeholder="Search your sessions"
          aria-label="Search your sessions"
        />

        <button type="submit" className="btn join-item" aria-label="Search">
          <FaSearch />
        </button>
      </form>

      {/* Display success messages. */}
      {success && (
        <div className="alert alert-success mx-4 mb-3 w-auto self-stretch text-sm">
          <span>{success}</span>

          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => setSuccess(null)}
            aria-label="Dismiss success message"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Display error messages. */}
      {error && (
        <div className="alert alert-error mx-4 mb-3 w-auto self-stretch text-sm">
          <span>{error}</span>

          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => setError(null)}
            aria-label="Dismiss error message"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Display the loading indicator or session list. */}
      {isLoading ? (
        <span className="loading loading-spinner loading-xl m-8" />
      ) : sessions.length === 0 ? (
        <span className="p-4 text-sm opacity-60">
          {filter.trim()
            ? "No matching sessions found."
            : "You have no sessions yet."}
        </span>
      ) : (
        <ul className="list w-full self-stretch gap-3 px-4">
          {sessions.map((session) => (
            <li
              key={session.session_id}
              className="list-row mb-3 items-center gap-4 rounded-xl border border-blue-500 p-4 shadow-sm"
            >
              <div className="min-w-0 space-y-2">

                {/* Activity name */}
                <div className="flex items-center gap-2 break-words font-semibold">
                  <FaPerson className="shrink-0 text-primary" />
                  <span>{session.activity_name || "N/A"}</span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm uppercase opacity-70">
                  <FaLocationDot className="shrink-0 text-primary" />
                  <span>{session.location_name || "N/A"}</span>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-sm">
                  <FaCalendarDays className="shrink-0 text-primary" />
                  <span>{formatDate(session.date)}</span>
                </div>

                {/* Start and end time */}
                <div className="flex items-center gap-2 text-sm">
                  <FaClock className="shrink-0 text-primary" />
                  <span>
                    {formatTime(session.start_time)} –{" "}
                    {formatTime(session.end_time)}
                  </span>
                </div>

                {/* Session capacity */}
                <div className="flex items-center gap-2 text-sm opacity-70">
                  <FaUsers className="shrink-0 text-primary" />
                  <span>Capacity: {session.capacity ?? "Not set"}</span>
                </div>
              </div>

              {/* Delete session button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDelete(session)}
                  className="btn btn-ghost btn-sm text-error"
                  disabled={isSaving}
                  aria-label="Delete session"
                  title="Delete session"
                >
                  <FaTrash />
                  <span className="hidden sm:inline">Delete Session</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default SessionManagementView;
