
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { FaSearch } from "react-icons/fa";
import { fetchAPI } from "../api.mjs";

function MySessionsView() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);

  // Edit session fields
  const [activity, setActivity] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("");

  // Create session fields
  const [newActivity, setNewActivity] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [newCapacity, setNewCapacity] = useState("");

  const [filter, setFilter] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const today = new Date().toLocaleDateString("en-CA");

  // Load sessions
  const getSessions = useCallback(() => {
    const authKey = localStorage.getItem("auth-key");

    if (!authKey) {
      navigate("/login");
      return;
    }

    setIsLoading(true);
    setError(null);

    const request =
      filter.trim().length > 0
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
          setSessions(response.body);
        } else {
          setError(
            response.body?.message || "Failed to load sessions",
          );
        }
      })
      .catch((err) => {
        setError(err.message || String(err));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [filter, navigate]);

  useEffect(() => {
    getSessions();
  }, [getSessions]);

  // Filter sessions in the browser
  const filteredSessions = sessions.filter((session) => {
    if (!filter.trim()) {
      return true;
    }

    const search = filter.toLowerCase().trim();

    return (
      session.activity_name?.toLowerCase().includes(search) ||
      session.location_name?.toLowerCase().includes(search) ||
      session.trainer_name?.toLowerCase().includes(search) ||
      String(session.date).toLowerCase().includes(search)
    );
  });

  // Select a session to edit
  const handleEdit = (session) => {
    setSelectedSession(session);

    setActivity(session.activity_name || "");
    setLocation(session.location_name || "");

    setDate(
      session.date ? String(session.date).substring(0, 10) : "",
    );

    setStartTime(
      session.start_time ? session.start_time.substring(0, 5) : "",
    );

    setEndTime(
      session.end_time ? session.end_time.substring(0, 5) : "",
    );

    setCapacity(session.capacity ?? "");

    setError(null);
    setSuccess(null);
  };

  // Reset edit form
  const handleCancel = () => {
    setSelectedSession(null);
    setActivity("");
    setLocation("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setCapacity("");
  };

  // Reset create form
  const resetCreateForm = () => {
    setNewActivity("");
    setNewLocation("");
    setNewDate("");
    setNewStartTime("");
    setNewEndTime("");
    setNewCapacity("");
  };

  // Create a new session
  const handleCreate = (event) => {
    event.preventDefault();

    const authKey = localStorage.getItem("auth-key");

    if (!authKey) {
      navigate("/login");
      return;
    }

    setError(null);
    setSuccess(null);

    if (newDate < today) {
      setError("Please select today or a future date.");
      return;
    }

    if (newEndTime <= newStartTime) {
      setError("End time must be later than start time.");
      return;
    }

    if (Number(newCapacity) < 1) {
      setError("Capacity must be at least 1.");
      return;
    }

    setIsCreating(true);

    fetchAPI(
      "POST",
      "/session",
      {
        activity_name: newActivity,
        location_name: newLocation,
        date: newDate,
        start_time: newStartTime,
        end_time: newEndTime,
        capacity: Number(newCapacity),
      },
      authKey,
    )
      .then((response) => {
        if (response.status === 200 || response.status === 201) {
          resetCreateForm();
          setSuccess("Session created successfully.");
          getSessions();
        } else {
          setError(
            response.body?.message || "Failed to create session",
          );
        }
      })
      .catch((err) => {
        setError(err.message || String(err));
      })
      .finally(() => {
        setIsCreating(false);
      });
  };

  // Update a session
  const handleUpdate = (event) => {
    event.preventDefault();

    if (!selectedSession) {
      return;
    }

    const authKey = localStorage.getItem("auth-key");

    if (!authKey) {
      navigate("/login");
      return;
    }

    setError(null);
    setSuccess(null);

    if (date < today) {
      setError("Please select today or a future date.");
      return;
    }

    if (endTime <= startTime) {
      setError("End time must be later than start time.");
      return;
    }

    if (Number(capacity) < 1) {
      setError("Capacity must be at least 1.");
      return;
    }

    setIsUpdating(true);

    fetchAPI(
      "PUT",
      "/session/" + selectedSession.session_id,
      {
        activity_name: activity,
        location_name: location,
        date,
        start_time: startTime,
        end_time: endTime,
        capacity: Number(capacity),
      },
      authKey,
    )
      .then((response) => {
        if (response.status === 200) {
          handleCancel();
          setSuccess("Session updated successfully.");
          getSessions();
        } else {
          setError(
            response.body?.message || "Failed to update session",
          );
        }
      })
      .catch((err) => {
        setError(err.message || String(err));
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };

  // Delete a session
  const handleDelete = () => {
    if (!selectedSession) {
      return;
    }

    const authKey = localStorage.getItem("auth-key");

    if (!authKey) {
      navigate("/login");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this session?")) {
      return;
    }

    setError(null);
    setSuccess(null);
    setIsDeleting(true);

    fetchAPI(
      "DELETE",
      "/session/" + selectedSession.session_id,
      null,
      authKey,
    )
      .then((response) => {
        if (response.status === 200) {
          handleCancel();
          setSuccess("Session deleted successfully.");
          getSessions();
        } else {
          setError(
            response.body?.message || "Failed to delete session",
          );
        }
      })
      .catch((err) => {
        setError(err.message || String(err));
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto w-full px-4 py-6 sm:px-6">
        {/* HEADER */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">
            📅 My Sessions
          </h1>
          <p className="text-base-content/60 mt-2">
            Manage your training sessions in one place.
          </p>
        </div>

        {/* SEARCH BAR */}
        <div className="join flex w-full mb-6">
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            type="text"
            className="input input-bordered join-item grow min-w-0"
            placeholder="Search sessions by activity, location, trainer or date"
          />

          <button
            type="button"
            onClick={getSessions}
            className="btn join-item"
            aria-label="Search sessions"
          >
            <FaSearch />
          </button>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="alert alert-error mb-4" role="alert">
            <span>{error}</span>
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {success && (
          <div className="alert alert-success mb-4" role="status">
            <span>{success}</span>
          </div>
        )}

        {/* MY SESSIONS TABLE */}
        <section className="mb-10">
          <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Date</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Location</th>
                  <th>Capacity</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan="7" className="text-center py-8">
                      <span className="loading loading-spinner loading-md" />
                    </td>
                  </tr>
                )}

                {!isLoading && filteredSessions.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-8 text-base-content/60"
                    >
                      No sessions found.
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  filteredSessions.map((session) => (
                    <tr
                      key={session.session_id}
                      className="border-b border-base-300"
                    >
                      <td className="font-semibold">
                        {session.activity_name}
                      </td>

                      <td>
                        {session.date
                          ? String(session.date).substring(0, 10)
                          : ""}
                      </td>

                      <td>
                        {session.start_time
                          ? String(session.start_time).substring(0, 5)
                          : ""}
                      </td>

                      <td>
                        {session.end_time
                          ? String(session.end_time).substring(0, 5)
                          : ""}
                      </td>

                      <td>{session.location_name}</td>
                      <td>{session.capacity}</td>

                      <td className="text-center">
                        <button
                          type="button"
                          onClick={() => handleEdit(session)}
                          className="btn btn-primary btn-sm"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* EDIT SESSION SECTION */}
        {selectedSession && (
          <section className="mb-10">
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold">
                Edit Session
              </h2>
              <p className="text-base-content/60 mt-1">
                Update the details of your selected session.
              </p>
            </div>

            <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-4 sm:p-6">
              <form onSubmit={handleUpdate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      Activity
                    </label>
                    <input
                      type="text"
                      value={activity}
                      onChange={(event) => setActivity(event.target.value)}
                      required
                      className="input input-bordered w-full"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      required
                      className="input input-bordered w-full"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      min={today}
                      onChange={(event) => setDate(event.target.value)}
                      required
                      className="input input-bordered w-full"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      Capacity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={capacity}
                      onChange={(event) => setCapacity(event.target.value)}
                      required
                      className="input input-bordered w-full"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      required
                      className="input input-bordered w-full"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      required
                      className="input input-bordered w-full"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={isUpdating || isDeleting}
                    className="btn btn-success flex-1"
                  >
                    {isUpdating ? "Updating..." : "Update Session"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isUpdating || isDeleting}
                    className="btn btn-outline flex-1"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isUpdating || isDeleting}
                    className="btn btn-error flex-1"
                  >
                    {isDeleting ? "Deleting..." : "Delete Session"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* CREATE NEW SESSION SECTION */}
        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-xl sm:text-2xl font-bold">
              New Session
            </h2>
            <p className="text-base-content/60 mt-1">
              Schedule a new training session for your members.
            </p>
          </div>

          <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-4 sm:p-6">
            <form onSubmit={handleCreate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Activity
                  </label>
                  <input
                    type="text"
                    value={newActivity}
                    onChange={(event) =>
                      setNewActivity(event.target.value)
                    }
                    placeholder="Yoga"
                    required
                    className="input input-bordered w-full"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(event) =>
                      setNewLocation(event.target.value)
                    }
                    placeholder="Ashgrove"
                    required
                    className="input input-bordered w-full"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    min={today}
                    onChange={(event) => setNewDate(event.target.value)}
                    required
                    className="input input-bordered w-full"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newCapacity}
                    onChange={(event) =>
                      setNewCapacity(event.target.value)
                    }
                    placeholder="20"
                    required
                    className="input input-bordered w-full"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(event) =>
                      setNewStartTime(event.target.value)
                    }
                    required
                    className="input input-bordered w-full"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(event) =>
                      setNewEndTime(event.target.value)
                    }
                    required
                    className="input input-bordered w-full"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="btn btn-primary w-full mt-6"
              >
                {isCreating ? "Creating..." : "Create Session"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

export default MySessionsView;
