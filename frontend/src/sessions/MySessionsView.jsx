import { useCallback, useEffect, useState } from "react";
import { FaSearch, FaTimes, FaPlus } from "react-icons/fa";
import { fetchAPI } from "../api.mjs";

function MySessionsView() {
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const [editForm, setEditForm] = useState({
    date: "",
    start_time: "",
    end_time: "",
    capacity: "",
  });

  const getSessions = useCallback(async () => {
    const authKey = localStorage.getItem("auth-key");

    if (!authKey) {
      setSessions([]);
      setError("Please log in to view your sessions.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const query = filter.trim()
        ? `?filter=${encodeURIComponent(filter.trim())}`
        : "";

      const response = await fetchAPI("GET", `/session${query}`, null, authKey);

      if (response.status === 200) {
        setSessions(Array.isArray(response.body) ? response.body : []);
      } else {
        setSessions([]);
        setError(response.body?.message || "Failed to load sessions.");
      }
    } catch (err) {
      setError(
        typeof err === "string"
          ? err
          : err.message || "Failed to load sessions.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    getSessions();
  }, [getSessions]);

  const handleEdit = (session) => {
    setError(null);
    setSuccess(null);
    setEditingSession(session);
    setIsCreating(false);

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

  const handleCreate = () => {
    setError(null);
    setSuccess(null);
    setEditingSession(null);
    setIsCreating(true);

    setEditForm({
      date: "",
      start_time: "",
      end_time: "",
      capacity: "",
    });
  };

  const handleDelete = async (session) => {
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

    try {
      const response = await fetchAPI(
        "DELETE",
        `/session/${session.session_id}`,
        null,
        authKey,
      );

      if (response.status === 200) {
        setSuccess("Session deleted successfully.");
        await getSessions();
      } else {
        setError(response.body?.message || "Failed to delete the session.");
      }
    } catch (err) {
      setError(
        typeof err === "string"
          ? err
          : err.message || "Failed to delete the session.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  const handleCancel = () => {
    if (isSaving) return;

    setEditingSession(null);
    setIsCreating(false);
    setError(null);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const authKey = localStorage.getItem("auth-key");

    if (!authKey) {
      setError("Please log in to manage your sessions.");
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

    if (editForm.date < new Date().toLocaleDateString("en-CA")) {
      setError("The session date cannot be in the past.");
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

    const sessionData = {
      date: editForm.date,
      start_time: editForm.start_time,
      end_time: editForm.end_time,
      capacity: Number(editForm.capacity),
    };

    try {
      const response = isCreating
        ? await fetchAPI("POST", "/session", sessionData, authKey)
        : await fetchAPI(
          "PUT",
          `/session/${editingSession.session_id}`,
          sessionData,
          authKey,
        );

      if (response.status === 200 || response.status === 201) {
        setSuccess(
          isCreating
            ? "Session created successfully."
            : "Session updated successfully.",
        );

        setEditingSession(null);
        setIsCreating(false);

        await getSessions();
      } else {
        setError(response.body?.message || "Failed to save the session.");
      }
    } catch (err) {
      setError(
        typeof err === "string"
          ? err
          : err.message || "Failed to save the session.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date) =>
    date ? String(date).substring(0, 10) : "Not set";

  const formatTime = (time) =>
    time ? String(time).substring(0, 5) : "Not set";

  return (
    <section className="mx-auto flex w-full min-w-0 flex-col gap-4 p-3">
      {/* Header */}
      <div className="flex w-full justify-start">
        <button
          type="button"
          onClick={handleCreate}
          className="btn btn-primary btn-sm"
        >
          <FaPlus />
          Create New Session
        </button>
      </div>

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

      {/* Session Cards */}
      {isLoading ? (
        <div className="flex justify-center rounded-xl bg-base-100 p-8 shadow-sm">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl bg-base-100 p-6 text-center text-sm text-base-content/60 shadow-sm">
          {filter.trim() ? "No sessions found." : "You have no sessions yet."}
        </div>
      ) : (
        <div className="flex w-full min-w-0 flex-col gap-4">
          {sessions.map((session) => (
            <article
              key={session.session_id}
              className="w-full min-w-0 rounded-xl border border-base-200 bg-base-100 p-4 shadow-sm"
            >
              <h2 className="mb-4 break-words text-lg font-bold">
                {session.activity_name || "N/A"}
              </h2>

              {/* Session Details */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-4 text-sm">
                <div className="min-w-0">
                  <p className="text-xs text-base-content/60">Location</p>
                  <p className="mt-1 break-words font-medium">
                    {session.location_name || "N/A"}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-base-content/60">Date</p>
                  <p className="mt-1 break-words font-medium">
                    {formatDate(session.date)}
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

                <div className="min-w-0">
                  <p className="text-xs text-base-content/60">Capacity</p>
                  <p className="mt-1 font-medium">
                    {session.capacity ?? "Not set"}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-base-content/60">Trainer</p>
                  <p className="mt-1 break-words font-medium">
                    {session.trainer_name || "You"}
                  </p>
                </div>
              </div>

              {/* Edit and Delete Buttons */}
              <div className="mt-4 flex gap-2 border-t border-base-200 pt-3">
                <button
                  type="button"
                  onClick={() => handleEdit(session)}
                  className="btn btn-primary btn-sm flex-1"
                >
                  Edit Session
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(session)}
                  className="btn btn-error btn-sm flex-1"
                  disabled={isSaving}
                >
                  Delete Session
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Create or Edit Session Modal */}
      {(isCreating || editingSession) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3">
          <div
            className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-sm flex-col overflow-hidden rounded-xl bg-base-100 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-form-title"
          >
            {/* Modal Header */}
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-base-200 p-4">
              <div className="min-w-0">
                <h2 id="session-form-title" className="text-xl font-bold">
                  {isCreating ? "Create New Session" : "Edit Session"}
                </h2>
                <p className="mt-1 text-sm text-base-content/60">
                  {isCreating
                    ? "Enter your new session details."
                    : "Update your training session details."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-ghost btn-sm btn-square shrink-0"
                aria-label="Close form"
                disabled={isSaving}
              >
                <FaTimes />
              </button>
            </div>

            {/* Existing Session Information */}
            {editingSession && (
              <div className="grid shrink-0 grid-cols-2 gap-3 border-b border-base-200 p-4 text-sm">
                <div className="min-w-0">
                  <p className="text-xs text-base-content/60">Activity Name</p>
                  <p className="mt-1 break-words font-medium">
                    {editingSession.activity_name || "N/A"}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-base-content/60">Location</p>
                  <p className="mt-1 break-words font-medium">
                    {editingSession.location_name || "N/A"}
                  </p>
                </div>
              </div>
            )}

            {/* Session Form */}
            <form
              onSubmit={handleSave}
              className="flex min-h-0 flex-1 flex-col"
            >
              {/* Only the fields scroll */}
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
                <div>
                  <label
                    htmlFor="session-date"
                    className="mb-1 block text-sm font-medium"
                  >
                    Date
                  </label>
                  <input
                    id="session-date"
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
                    htmlFor="session-start-time"
                    className="mb-1 block text-sm font-medium"
                  >
                    Start Time
                  </label>
                  <input
                    id="session-start-time"
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
                    htmlFor="session-end-time"
                    className="mb-1 block text-sm font-medium"
                  >
                    End Time
                  </label>
                  <input
                    id="session-end-time"
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
                    htmlFor="session-capacity"
                    className="mb-1 block text-sm font-medium"
                  >
                    Capacity
                  </label>
                  <input
                    id="session-capacity"
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
              </div>

              {/* Save and Cancel remain visible */}
              <div className="relative z-10 shrink-0 space-y-2 border-t border-base-200 bg-base-100 p-4">
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Saving...
                    </>
                  ) : isCreating ? (
                    "Create Session"
                  ) : (
                    "Save"
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-outline w-full"
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
