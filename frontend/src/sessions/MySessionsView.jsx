import { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router";

function MySessionsView() {
  const navigate = useNavigate();
  const [session, setSession] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8080/api/session")
      .then((response) => response.json())
      .then((body) => {
        console.log(body);
        setSession(body);
      });
  }, [setSession]);

  return (
    <section className="flex flex-col items-center">
      <div className="join p-4 self-stretch">
        <input
          className="input join-item grow"
          placeholder="Search sessions by trainer name"
          type="text"
        />
        <button className="btn join-item">
          <FaSearch />
        </button>
      </div>
      {/* <span className="p-4">Status text</span>
      <span className="loading loading-spinner loading-xl"></span> */}
      <ul className="list self-stretch">
        {session.map((session) => (
          <li key={session.id} className="list-row">
            <div>
              <div>{session.trainer_name}</div>
              <div>{session.activity_name}</div>
              <div>{session.location_name}</div>
              <div>{session.date}</div>
              <div>{session.start_time}</div>
              <div>{session.end_time}</div>
              <div>{session.capacity}</div>
            </div>
            <button
              onClick={() => navigate("/sessions/" + session.id)}
              className="btn btn-ghost text-xl"
            >
              Edit
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
export default MySessionsView;
