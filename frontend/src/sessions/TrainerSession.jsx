import { useEffect, useState } from "react";

function TrainerSession() {
  const authKey = localStorage.getItem("authKey");

  const [sessions, setSessions] = useState([]);
  const [locations, setLocations] = useState([]);
  const [activities, setActivities] = useState([]);

  const [form, setForm] = useState({
    action: "create",
    session_id: "",
    activity_id: "",
    location_id: "",
    date: "",
    start_time: "",
    end_time: "",
    capacity: ""
  });

  const fetchSessions = async () => {
    try {
      const res = await fetch("http://localhost:3000/session/trainer/view", {
        headers: {
          "auth-key": authKey
        }
      });
      const data = await res.json();
      setSessions(data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchMeta = async () => {
    try {
      const [locRes, actRes] = await Promise.all([
        fetch("http://localhost:3000/location", { headers: { "auth-key": authKey } }),
        fetch("http://localhost:3000/activity", { headers: { "auth-key": authKey } })
      ]);

      setLocations(await locRes.json());
      setActivities(await actRes.json());

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchMeta();
    fetchSessions();
  }, []);

  const handleFormChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const submitForm = async (e) => {
    e.preventDefault();

    await fetch("http://localhost:3000/session/trainer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "auth-key": authKey
      },
      body: JSON.stringify(form)
    });

    setForm({
      action: "create",
      session_id: "",
      activity_id: "",
      location_id: "",
      date: "",
      start_time: "",
      end_time: "",
      capacity: ""
    });

    fetchSessions();
  };

  const editSession = (item) => {
    setForm({
      action: "update",
      session_id: item.session.id,
      activity_id: item.activity.id,
      location_id: item.location.id,
      date: item.session.date,
      start_time: item.session.start_time,
      end_time: item.session.end_time,
      capacity: item.session.capacity
    });
  };

  const deleteSession = async (id) => {
    await fetch("http://localhost:3000/session/trainer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "auth-key": authKey
      },
      body: JSON.stringify({
        action: "delete",
        session_id: id
      })
    });

    fetchSessions();
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4">

      <h1 className="text-2xl font-bold mb-2">
        📅 My Sessions
      </h1>

      <p className="text-gray-600 mb-5">
        Create and manage your training sessions
      </p>

      <div className="bg-white rounded shadow p-4 mb-6">

        {sessions.length === 0 ?

          <p className="text-center p-5">
            No sessions found
          </p>

          :

          sessions.map(item => (

            <div key={item.session.id} className="border rounded-lg p-4 mb-4">

              <p>
                <b>Activity:</b> {item.activity.name}
              </p>

              <p>
                <b>Date:</b> {item.session.date}
              </p>

              <p>
                <b>Time:</b> {item.session.start_time}-{item.session.end_time}
              </p>

              <p>
                <b>Location:</b> {item.location.name}
              </p>

              <p>
                <b>Capacity:</b> {item.session.capacity}
              </p>

              <div className="flex gap-2 mt-4">

                <button
                  onClick={() => editSession(item)}
                  className="bg-blue-500 text-white rounded py-2 flex-1"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteSession(item.session.id)}
                  className="bg-red-500 text-white rounded py-2 flex-1"
                >
                  Delete
                </button>

              </div>

            </div>

          ))

        }

      </div>

      <div className="bg-white rounded shadow p-4">

        <h2 className="text-xl font-bold mb-4">
          {form.action === "update" ? "Edit Session" : "Create Session"}
        </h2>

        <form
          onSubmit={submitForm}
          className="flex flex-col gap-3"
        >

          <select
            name="activity_id"
            value={form.activity_id}
            onChange={handleFormChange}
            className="border rounded p-3 w-full"
          >

            <option value="">
              Select Activity
            </option>

            {activities.map(a => (

              <option key={a.id} value={a.id}>
                {a.name}
              </option>

            ))}

          </select>

          <select
            name="location_id"
            value={form.location_id}
            onChange={handleFormChange}
            className="border rounded p-3 w-full"
          >

            <option value="">
              Select Location
            </option>

            {locations.map(l => (

              <option key={l.id} value={l.id}>
                {l.name}
              </option>

            ))}

          </select>

          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleFormChange}
            className="border rounded p-3 w-full"
          />

          <input
            type="time"
            name="start_time"
            value={form.start_time}
            onChange={handleFormChange}
            className="border rounded p-3 w-full"
          />

          <input
            type="time"
            name="end_time"
            value={form.end_time}
            onChange={handleFormChange}
            className="border rounded p-3 w-full"
          />

          <input
            type="number"
            name="capacity"
            value={form.capacity}
            onChange={handleFormChange}
            placeholder="Capacity"
            className="border rounded p-3 w-full"
          />

          <button className="bg-green-600 text-white rounded p-3 w-full">
            {form.action === "update" ? "Update" : "Create"}
          </button>

        </form>

      </div>

    </main>
  );

}

export default TrainerSession;