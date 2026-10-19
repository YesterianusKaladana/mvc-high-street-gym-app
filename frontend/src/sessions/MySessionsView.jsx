import { useState, useEffect, useCallback } from "react";
import {
  FaPerson,
  FaLocationDot,
  FaCalendarDays,
  FaClock,
  FaUsers,
} from "react-icons/fa6";
import { FaSearch, FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import { fetchAPI } from "../api.mjs";

function MySessionsView() {
  const [sessions, setSessions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const [editForm, setEditForm] = useState({
    activity_id: "",
    location_id: "",
    date: "",
    start_time: "",
    end_time: "",
    capacity: "",
  });

  const getSessions = useCallback(async (searchFilter = "") => {
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
      const response = await fetchAPI("GET", "/session", null, authKey);

      if (response.status === 200) {
        const allSessions = Array.isArray(response.body) ? response.body : [];

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
          setError("No results found");
        }
      } else {
        setSessions([]);
        setError(response.body?.message || "Failed to load sessions.");
      }
    } catch (err) {
      setSessions([]);
      setError(
        typeof err === "string"
          ? err
          : err.message || "Failed to load sessions.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSessionOptions = useCallback(async () => {
    const authKey = localStorage.getItem("auth-key");

    if (!authKey) return;

    try {
      const [activityResponse, locationResponse] = await Promise.all([
        fetchAPI("GET", "/activity", null, authKey),
        fetchAPI("GET", "/location", null, authKey),
      ]);

      if (activityResponse.status === 200) {
        setActivities(
          Array.isArray(activityResponse.body) ? activityResponse.body : [],
        );
      } else {
        setError(
          activityResponse.body?.message || "Failed to load activities.",
        );
      }

      if (locationResponse.status === 200) {
        setLocations(
          Array.isArray(locationResponse.body) ? locationResponse.body : [],
        );
      } else {
        setError(locationResponse.body?.message || "Failed to load locations.");
      }
    } catch (err) {
      console.error("Failed to load session options:", err);
      setError("Failed to load activities and locations.");
    }
  }, []);

  useEffect(() => {
    getSessions();
    getSessionOptions();
  }, [getSessions, getSessionOptions]);

  const handleEdit = (session) => {
    setError(null);
    setSuccess(null);
    setEditingSession(session);
    setIsCreating(false);

    setEditForm({
      activity_id: String(session.activity_id ?? ""),
      location_id: String(session.location_id ?? ""),
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
      activity_id: "",
      location_id: "",
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
        await getSessions(filter);
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

    setEditForm((previous) => ({
      ...previous,
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
      !editForm.activity_id ||
      !editForm.location_id ||
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

    const sessionDateTime = new Date(`${editForm.date}T${editForm.start_time}`);

    if (
      Number.isNaN(sessionDateTime.getTime()) ||
      sessionDateTime <= new Date()
    ) {
      setError("The session must start in the future.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const sessionData = {
      activity_id: Number(editForm.activity_id),
      location_id: Number(editForm.location_id),
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

        await getSessions(filter);
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
    <section className="flex min-w-0 flex-col items-center">
      <div className="flex w-full justify-start p-4">
        <button
          type="button"
          onClick={handleCreate}
          className="btn btn-primary"
        >
          <FaPlus />
          Create New Session
        </button>
      </div>

      <form
        className="join self-stretch p-4 pt-0"
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
              className="list-row items-center gap-4 border border-blue-500 rounded-xl p-4 mb-3 shadow-sm"
            >
              <div className="min-w-0 space-y-2">
                <div className="flex items-center gap-2 break-words font-semibold">
                  <FaPerson className="shrink-0 text-primary" />
                  <span>{session.activity_name || "N/A"}</span>
                </div>

                <div className="flex items-center gap-2 text-sm uppercase opacity-70">
                  <FaLocationDot className="shrink-0 text-primary" />
                  <span>{session.location_name || "N/A"}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <FaCalendarDays className="shrink-0 text-primary" />
                  <span>{formatDate(session.date)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <FaClock className="shrink-0 text-primary" />
                  <span>
                    {formatTime(session.start_time)} –{" "}
                    {formatTime(session.end_time)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm opacity-70">
                  <FaUsers className="shrink-0 text-primary" />
                  <span>Capacity: {session.capacity ?? "Not set"}</span>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(session)}
                  className="btn btn-ghost btn-sm"
                  aria-label="Edit session"
                  title="Edit session"
                >
                  <FaEdit />
                  <span className="hidden sm:inline">Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(session)}
                  className="btn btn-ghost btn-sm text-error"
                  disabled={isSaving}
                  aria-label="Delete session"
                  title="Delete session"
                >
                  <FaTrash />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {(isCreating || editingSession) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3">
          <div
            className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-sm flex-col overflow-hidden rounded-xl bg-base-100 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-form-title"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-base-200 p-4">
              <div>
                <h2 id="session-form-title" className="text-xl font-bold">
                  {isCreating ? "Create New Session" : "Edit Session"}
                </h2>

                <p className="mt-1 text-sm opacity-60">
                  {isCreating
                    ? "Enter your new session details."
                    : "Update your training session details."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-ghost btn-sm btn-square"
                aria-label="Close form"
                disabled={isSaving}
              >
                <FaTimes />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
                <div>
                  <label
                    htmlFor="session-activity"
                    className="mb-1 block text-sm font-medium"
                  >
                    Activity
                  </label>

                  <select
                    id="session-activity"
                    name="activity_id"
                    value={editForm.activity_id}
                    onChange={handleFormChange}
                    className="select select-bordered w-full"
                    required
                  >
                    <option value="">Select an activity</option>

                    {activities.map((activity) => (
                      <option key={activity.id} value={activity.id}>
                        {activity.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="session-location"
                    className="mb-1 block text-sm font-medium"
                  >
                    Location
                  </label>

                  <select
                    id="session-location"
                    name="location_id"
                    value={editForm.location_id}
                    onChange={handleFormChange}
                    className="select select-bordered w-full"
                    required
                  >
                    <option value="">Select a location</option>

                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>

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

              <div className="shrink-0 space-y-2 border-t border-base-200 bg-base-100 p-4">
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
                  ) : isCreating ? (
                    "Create Session"
                  ) : (
                    "Save Changes"
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
