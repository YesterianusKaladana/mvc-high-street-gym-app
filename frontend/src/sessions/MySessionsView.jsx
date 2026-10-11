import { useCallback, useEffect, useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { fetchAPI } from "../api.mjs";

function MySessionsView() {
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  const [editForm, setEditForm] = useState({
    date: "",
    start_time: "",
    end_time: "",
    capacity: "",
  });

  // Load sessions
  const getSessions = useCallback(() => {
    const authKey = localStorage.getItem("auth-key");

    if (!authKey) {
      setError("Please log in to view your sessions.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const request = filter.trim()
      ? fetchAPI(
        "GET",
        "/session?filter=" + encodeURIComponent(filter.trim()),
        null,
        authKey,
      )
      : fetchAPI("GET", "/session", null, authKey);

    request
      .then((response) => {
        if (response.status === 200) {
          setSessions(Array.isArray(response.body) ? response.body : []);
        } else {
          setError(response.body?.message || "Failed to load sessions.");
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load sessions.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [filter]);

  useEffect(() => {
    getSessions();
  }, [getSessions]);

  // Open edit form
  const handleEdit = (session) => {
    setError(null);
    setSuccess(null);
    setEditingSession(session);

    setEditForm({
      date: session.date ? String(session.date).substring(0, 10) : "",
      start_time: session.start_time
        ? String(session.start_time).substring(0, 5)
        : "",
      end_time: session.end_time
        ? String(session.end_time).substring(0, 5)
        : "",
      capacity: session.capacity ?? "",
    });
  };

  // Handle form changes
  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  // Close edit form
  const handleCancelEdit = () => {
    setEditingSession(null);
    setError(null);
  };

  // Save session changes
  const handleSaveEdit = async (event) => {
    event.preventDefault();

    if (!editingSession) return;

    const authKey = localStorage.getItem("auth-key");

    if (!authKey) {
      setError("Please log in to update your sessions.");
      return;
    }

    if (
      !editForm.date ||
      !editForm.start_time ||
      !editForm.end_time ||
      editForm.capacity === ""
    ) {
      setError("Please complete all session fields.");
      return;
    }

    if (editForm.start_time >= editForm.end_time) {
      setError("The end time must be later than the start time.");
      return;
    }

    if (
      !Number.isInteger(Number(editForm.capacity)) ||
      Number(editForm.capacity) < 1
    ) {
      setError("Capacity must be a whole number greater than zero.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetchAPI(
        "PUT",
        `/session/${editingSession.session_id}`,
        {
          date: editForm.date,
          start_time: editForm.start_time,
          end_time: editForm.end_time,
          capacity: Number(editForm.capacity),
        },
        authKey,
      );

      if (response.status === 200) {
        setEditingSession(null);
        setSuccess("Session updated successfully.");
        getSessions();
      } else {
        setError(response.body?.message || "Failed to update the session.");
      }
    } catch (err) {
      setError(err.message || "Failed to update the session.");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter sessions
  const search = filter.toLowerCase().trim();

  const filteredSessions = sessions.filter((session) => {
    if (!search) return true;

    return (
      session.activity_name?.toLowerCase().includes(search) ||
      session.location_name?.toLowerCase().includes(search) ||
      session.trainer_name?.toLowerCase().includes(search) ||
      String(session.date ?? "")
        .toLowerCase()
        .includes(search)
    );
  });

  // Format date
  const formatDate = (date) =>
    date ? String(date).substring(0, 10) : "Not set";

  // Format time
  const formatTime = (time) =>
    time ? String(time).substring(0, 5) : "Not set";

  return (
    <section className="mx-auto flex w-full min-w-0 flex-col gap-4 p-3">
      {/* Header */}
      <header className="w-full rounded-xl bg-base-100 p-4 shadow-sm">
        <h1 className="text-xl font-bold">My Sessions</h1>
        <p className="mt-1 text-sm text-base-content/60">
          View and manage your training schedule.
        </p>
      </header>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error text-sm" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="alert alert-success text-sm" role="status">
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

      {/* Search */}
      <form
        className="flex w-full min-w-0 gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          getSessions();
        }}
      >
        <input
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Search sessions..."
          className="input input-bordered min-w-0 flex-1"
          aria-label="Search sessions"
        />

        <button
          type="submit"
          className="btn btn-primary shrink-0"
          aria-label="Search"
        >
          <FaSearch />
        </button>
      </form>

      {/* Mobile Session Cards */}
      <div className="flex w-full min-w-0 flex-col gap-4">
        {isLoading && (
          <div className="flex justify-center rounded-xl bg-base-100 p-8 shadow-sm">
            <span className="loading loading-spinner loading-lg" />
          </div>
        )}

        {!isLoading && !error && filteredSessions.length === 0 && (
          <div className="rounded-xl bg-base-100 p-6 text-center text-sm text-base-content/60 shadow-sm">
            No sessions found.
          </div>
        )}

        {!isLoading &&
          filteredSessions.map((session) => (
            <article
              key={session.session_id}
              className="w-full min-w-0 rounded-xl border border-base-200 bg-base-100 p-4 shadow-sm"
            >
              {/* Activity */}
              <div className="mb-4 border-b border-base-200 pb-3">
                <h2 className="break-words text-lg font-bold">
                  {session.activity_name || "Not set"}
                </h2>
                <p className="mt-1 break-words text-sm text-base-content/60">
                  {session.location_name || "Not set"}
                </p>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-4 text-sm">
                <div className="min-w-0">
                  <p className="text-xs text-base-content/60">Date</p>
                  <p className="mt-1 break-words font-medium">
                    {formatDate(session.date)}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-base-content/60">Capacity</p>
                  <p className="mt-1 font-medium">
                    {session.capacity ?? "Not set"}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-base-content/60">Start Time</p>
                  <p className="mt-1 font-medium">
                    {formatTime(session.start_time)}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-base-content/60">End Time</p>
                  <p className="mt-1 font-medium">
                    {formatTime(session.end_time)}
                  </p>
                </div>

                <div className="col-span-2 min-w-0">
                  <p className="text-xs text-base-content/60">Trainer</p>
                  <p className="mt-1 break-words font-medium">
                    {session.trainer_name || "You"}
                  </p>
                </div>
              </div>

              {/* Edit Button */}
              <div className="mt-4 border-t border-base-200 pt-3">
                <button
                  type="button"
                  onClick={() => handleEdit(session)}
                  className="btn btn-primary btn-sm w-full"
                >
                  Edit Session
                </button>
              </div>
            </article>
          ))}
      </div>

      {/* Edit Session Modal */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3">
          <div
            className="my-auto w-full max-w-sm rounded-xl bg-base-100 p-4 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-session-title"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="edit-session-title" className="text-xl font-bold">
                  Edit Session
                </h2>
                <p className="mt-1 break-words text-sm text-base-content/60">
                  {editingSession.activity_name || "Session"}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancelEdit}
                className="btn btn-ghost btn-sm btn-square shrink-0"
                aria-label="Close edit form"
                disabled={isSaving}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="edit-date"
                  className="mb-1 block text-sm font-medium"
                >
                  Date
                </label>
                <input
                  id="edit-date"
                  type="date"
                  name="date"
                  value={editForm.date}
                  onChange={handleFormChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="edit-start-time"
                  className="mb-1 block text-sm font-medium"
                >
                  Start Time
                </label>
                <input
                  id="edit-start-time"
                  type="time"
                  name="start_time"
                  value={editForm.start_time}
                  onChange={handleFormChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="edit-end-time"
                  className="mb-1 block text-sm font-medium"
                >
                  End Time
                </label>
                <input
                  id="edit-end-time"
                  type="time"
                  name="end_time"
                  value={editForm.end_time}
                  onChange={handleFormChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="edit-capacity"
                  className="mb-1 block text-sm font-medium"
                >
                  Capacity
                </label>
                <input
                  id="edit-capacity"
                  type="number"
                  name="capacity"
                  min="1"
                  step="1"
                  value={editForm.capacity}
                  onChange={handleFormChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>

              {/* Form Buttons */}
              <div className="mt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Saving...
                    </>
                  ) : (
                    <>Save</>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn btn-ghost w-full"
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default MySessionsView;
