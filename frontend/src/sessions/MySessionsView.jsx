import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { FaSearch } from "react-icons/fa";
import { fetchAPI } from "../api.mjs";

function MySessionsView() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);

  const [activity, setActivity] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("");

  const [filter, setFilter] = useState("");

  const [selectedSession, setSelectedSession] = useState(null);

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const getSessions = useCallback(() => {
    const authKey = localStorage.getItem("auth-key");

    if (!authKey) {
      navigate("/login");
      return;
    }

    setIsLoading(true);
    setError(null);

    const request =
      filter.length > 0
        ? fetchAPI("GET", "/session?filter=" + filter, null, authKey)
        : fetchAPI("GET", "/session", null, authKey);

    request
      .then((response) => {
        if (response.status == 200) {
          setSessions(response.body);
        } else {
          setError(
            response.body?.message ||
            "Failed to load sessions",
          );
        }
      })
      .catch((error) => {
        setError(error.message || String(error));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [filter, navigate]);

  useEffect(() => {
    getSessions();
  }, [getSessions]);

  const filteredSessions = sessions.filter((session) => {
    if (!filter) {
      return true;
    }

    const search = filter.toLowerCase();

    return (
      session.activity_name
        ?.toLowerCase()
        .includes(search) ||
      session.location_name
        ?.toLowerCase()
        .includes(search) ||
      session.trainer_name
        ?.toLowerCase()
        .includes(search) ||
      String(session.date)
        .toLowerCase()
        .includes(search)
    );
  });

  const handleEdit = (session) => {
    setSelectedSession(session);

    setActivity(session.activity_name || "");
    setLocation(session.location_name || "");

    setDate(
      session.date
        ? String(session.date).substring(0, 10)
        : "",
    );

    setStartTime(
      session.start_time
        ? session.start_time.substring(0, 5)
        : "",
    );

    setEndTime(
      session.end_time
        ? session.end_time.substring(0, 5)
        : "",
    );

    setCapacity(session.capacity || "");
  };

  const handleCancel = () => {
    setSelectedSession(null);
    setActivity("");
    setLocation("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setCapacity("");
  };

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

    fetchAPI(
      "PUT",
      "/session/" + selectedSession.session_id,
      {
        activity_name: activity,
        location_name: location,
        date: date,
        start_time: startTime,
        end_time: endTime,
        capacity: Number(capacity),
      },
      authKey,
    )
      .then((response) => {
        if (response.status == 200) {
          handleCancel();
          getSessions();
        } else {
          setError(
            response.body?.message ||
            "Failed to update session",
          );
        }
      })
      .catch((error) => {
        setError(error.message || String(error));
      });
  };

  const handleDelete = () => {
    if (!selectedSession) {
      return;
    }

    const authKey = localStorage.getItem("auth-key");

    if (!authKey) {
      navigate("/login");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this session?",
      )
    ) {
      return;
    }

    fetchAPI(
      "DELETE",
      "/session/" + selectedSession.session_id,
      null,
      authKey,
    )
      .then((response) => {
        if (response.status == 200) {
          handleCancel();
          getSessions();
        } else {
          setError(
            response.body?.message ||
            "Failed to delete session",
          );
        }
      })
      .catch((error) => {
        setError(error.message || String(error));
      });
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto w-full px-4 py-6 sm:px-6">

        {/* HEADER */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl">
            📅 My Sessions
          </h1>
        </div>

        {/* SEARCH BAR */}
        <div className="join p-4 self-stretch">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            type="text"
            className="input join-item grow"
            placeholder="search sessions"
          />

          <button
            onClick={() => getSessions()}
            className="btn join-item"
          >
            <FaSearch />
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="alert alert-error mb-6">
            <span>{error}</span>
          </div>
        )}

        {/* TABLE + FORM */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* TABLE */}
          <div className="lg:col-span-2 bg-base-100 rounded-xl shadow-sm border border-base-300 overflow-x-auto">

            <table className="table w-full">

              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Date</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Location</th>
                  <th>Capacity</th>
                  <th className="text-center">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>

                {isLoading && (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-8"
                    >
                      <span className="loading loading-spinner"></span>
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  filteredSessions.length === 0 && (
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
                    <tr key={session.session_id}>

                      <td className="font-semibold">
                        {session.activity_name}
                      </td>

                      <td>
                        {session.date
                          ? String(
                            session.date,
                          ).substring(0, 10)
                          : ""}
                      </td>

                      <td>
                        {session.start_time}
                      </td>

                      <td>
                        {session.end_time}
                      </td>

                      <td>
                        {session.location_name}
                      </td>

                      <td>
                        {session.capacity}
                      </td>

                      <td className="text-center">
                        <button
                          onClick={() =>
                            handleEdit(session)
                          }
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

          {/* FORM */}
          <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-4 sm:p-6">

            <h2 className="text-xl font-bold mb-4">
              {selectedSession
                ? "Edit Session"
                : "Create New Session"}
            </h2>

            <form onSubmit={handleUpdate}>

              {/* ACTIVITY */}
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium">
                  Activity
                </label>

                <input
                  type="text"
                  value={activity}
                  onChange={(e) =>
                    setActivity(e.target.value)
                  }
                  placeholder="Yoga"
                  required
                  disabled={!selectedSession}
                  className="input input-bordered w-full"
                />
              </div>

              {/* DATE */}
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium">
                  Date
                </label>

                <input
                  type="date"
                  value={date}
                  min={today}
                  onChange={(e) =>
                    setDate(e.target.value)
                  }
                  required
                  disabled={!selectedSession}
                  className="input input-bordered w-full"
                />
              </div>

              {/* START TIME */}
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium">
                  Start Time
                </label>

                <input
                  type="time"
                  value={startTime}
                  onChange={(e) =>
                    setStartTime(e.target.value)
                  }
                  required
                  disabled={!selectedSession}
                  className="input input-bordered w-full"
                />
              </div>

              {/* END TIME */}
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium">
                  End Time
                </label>

                <input
                  type="time"
                  value={endTime}
                  onChange={(e) =>
                    setEndTime(e.target.value)
                  }
                  required
                  disabled={!selectedSession}
                  className="input input-bordered w-full"
                />
              </div>

              {/* LOCATION */}
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium">
                  Location
                </label>

                <input
                  type="text"
                  value={location}
                  onChange={(e) =>
                    setLocation(e.target.value)
                  }
                  placeholder="Ashgrove"
                  required
                  disabled={!selectedSession}
                  className="input input-bordered w-full"
                />
              </div>

              {/* CAPACITY */}
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium">
                  Capacity
                </label>

                <input
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) =>
                    setCapacity(e.target.value)
                  }
                  required
                  disabled={!selectedSession}
                  className="input input-bordered w-full"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedSession}
                className="btn btn-success w-full"
              >
                Update
              </button>
            </form>

            {selectedSession && (
              <>
                <button
                  onClick={handleCancel}
                  className="btn btn-outline w-full mt-3"
                >
                  Cancel
                </button>

                <button
                  onClick={handleDelete}
                  className="btn btn-error w-full mt-3"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default MySessionsView;