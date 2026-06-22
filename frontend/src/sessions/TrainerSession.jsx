import { useEffect, useState } from "react";

function TrainerSession() {
  const authKey = localStorage.getItem("authKey");

  const [sessions, setSessions] = useState([]);
  const [locations, setLocations] = useState([]);
  const [activities, setActivities] = useState([]);

  const [selectedSession, setSelectedSession] = useState(null);

  const [filters, setFilters] = useState({
    activity: "",
    location: "",
    date: "",
    start_time: "",
    end_time: "",
    capacity: "",
  });

  const [form, setForm] = useState({
    action: "create",
    session_id: "",
    activity_id: "",
    location_id: "",
    date: "",
    start_time: "",
    end_time: "",
    capacity: "",
  });

  // =========================
  // FETCH TRAINER SESSIONS
  // =========================
  const fetchSessions = async () => {
    const query = new URLSearchParams(filters).toString();

    const res = await fetch(
      `http://localhost:3000/session/trainer/view?${query}`,
      {
        headers: {
          "auth-key": authKey,
        },
      }
    );

    const html = await res.text();

    // ⚠️ If you still return EJS, you cannot JSON parse it.
    // You MUST convert backend to JSON API for real React use.
    console.log(html);
  };

  // =========================
  // FETCH OPTIONS (mock endpoints recommended)
  // =========================
  const fetchMeta = async () => {
    const [locRes, actRes] = await Promise.all([
      fetch("http://localhost:3000/location", {
        headers: { "auth-key": authKey },
      }),
      fetch("http://localhost:3000/activity", {
        headers: { "auth-key": authKey },
      }),
    ]);

    setLocations(await locRes.json());
    setActivities(await actRes.json());
  };

  useEffect(() => {
    fetchMeta();
    fetchSessions();
  }, []);

  // =========================
  // FILTER CHANGE
  // =========================
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // =========================
  // FORM CHANGE
  // =========================
  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // =========================
  // CREATE / UPDATE / DELETE
  // =========================
  const submitForm = async (e) => {
    e.preventDefault();

    await fetch("http://localhost:3000/session/trainer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "auth-key": authKey,
      },
      body: JSON.stringify(form),
    });

    fetchSessions();
  };

  const editSession = (item) => {
    setSelectedSession(item);

    setForm({
      action: "update",
      session_id: item.session.id,
      activity_id: item.activity.id,
      location_id: item.location.id,
      date: item.session.date,
      start_time: item.session.start_time,
      end_time: item.session.end_time,
      capacity: item.session.capacity,
    });
  };

  const deleteSession = async (id) => {
    await fetch("http://localhost:3000/session/trainer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "auth-key": authKey,
      },
      body: JSON.stringify({
        action: "delete",
        session_id: id,
      }),
    });

    fetchSessions();
  };

  return (
    <main className="min-h-screen p-6 bg-gray-50">

      {/* HEADER */}
      <h1 className="text-3xl font-bold mb-2">📅 My Sessions</h1>
      <p className="text-gray-600 mb-4">
        Create and manage your training sessions
      </p>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded shadow mb-6 flex gap-3 flex-wrap">
        {Object.keys(filters).map((key) => (
          <input
            key={key}
            name={key}
            value={filters[key]}
            onChange={handleFilterChange}
            placeholder={key}
            className="border p-2 rounded"
          />
        ))}

        <button onClick={fetchSessions} className="bg-blue-600 text-white px-4 py-2 rounded">
          Search
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* TABLE */}
        <div className="col-span-2 bg-white p-4 rounded shadow">
          <table className="w-full">

            <thead className="bg-blue-600 text-white">
              <tr>
                <th>Activity</th>
                <th>Date</th>
                <th>Start</th>
                <th>End</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-4">
                    No sessions found
                  </td>
                </tr>
              ) : (
                sessions.map((item) => (
                  <tr key={item.session.id} className="border-b">

                    <td>{item.activity.name}</td>
                    <td>{item.session.date}</td>
                    <td>{item.session.start_time}</td>
                    <td>{item.session.end_time}</td>
                    <td>{item.location.name}</td>
                    <td>{item.session.capacity}</td>

                    <td className="flex gap-2">
                      <button
                        onClick={() => editSession(item)}
                        className="bg-blue-500 text-white px-2 py-1 rounded"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteSession(item.session.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>

        {/* FORM */}
        <div className="bg-white p-4 rounded shadow">

          <h2 className="text-xl font-bold mb-3">
            {form.action === "update" ? "Edit Session" : "Create Session"}
          </h2>

          <form onSubmit={submitForm} className="flex flex-col gap-3">

            <select
              name="activity_id"
              value={form.activity_id}
              onChange={handleFormChange}
            >
              <option>Select Activity</option>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <select
              name="location_id"
              value={form.location_id}
              onChange={handleFormChange}
            >
              <option>Select Location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>

            <input type="date" name="date" value={form.date} onChange={handleFormChange} />
            <input type="time" name="start_time" value={form.start_time} onChange={handleFormChange} />
            <input type="time" name="end_time" value={form.end_time} onChange={handleFormChange} />
            <input type="number" name="capacity" value={form.capacity} onChange={handleFormChange} />

            <button className="bg-green-600 text-white py-2 rounded">
              {form.action === "update" ? "Update" : "Create"}
            </button>

          </form>
        </div>

      </div>
    </main>
  );
}

export default TrainerSession;