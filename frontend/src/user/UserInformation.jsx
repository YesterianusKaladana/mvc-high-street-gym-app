import { useEffect, useState } from "react";
import { fetchAPI } from "../api.mjs";
import { FaUser, FaEnvelope, FaLock, FaSave, FaTimes } from "react-icons/fa";

function UserInformation() {
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const authenticationKey = localStorage.getItem("auth-key");

        const response = await fetchAPI(
          "GET",
          "/user/self",
          null,
          authenticationKey,
        );

        const userData = response.body;


        console.log("User", userData);

        setUser(userData);

        setForm({
          firstName: userData.first_name || "",
          lastName: userData.last_name || "",
          email: userData.email || "",
          password: "",
        });
      } catch (error) {
        console.error(error);
        setMessage("Failed to load profile");
      }
    }

    loadUser();
  }, []);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function saveProfile() {
    try {
      const authenticationKey = localStorage.getItem("auth-key");

      await fetchAPI(
        "PATCH",

        `/user/${user.id}`,

        {
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          password: form.password,
        },

        authenticationKey,
      );

      setMessage("Profile updated successfully!");
    } catch (error) {
      console.error(error);

      setMessage("Update user profile failed");
    }
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">

      <div className="bg-white rounded shadow p-4">
        {/* Profile Image */}

        <div className="flex justify-center mb-6">
          <div className="avatar">
            <div className="w-24 rounded-full bg-gray-200">
              <img
                src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                alt="profile"
              />
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();

            saveProfile();
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center border rounded p-3 gap-3">
            <FaUser className="text-gray-500" />

            <input
              className="w-full outline-none"
              placeholder="First Name"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center border rounded p-3 gap-3">
            <FaUser className="text-gray-500" />

            <input
              className="w-full outline-none"
              placeholder="Last Name"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center border rounded p-3 gap-3">
            <FaEnvelope className="text-gray-500" />

            <input
              className="w-full outline-none"
              placeholder="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center border rounded p-3 gap-3">
            <FaLock className="text-gray-500" />

            <input
              className="w-full outline-none"
              placeholder="New Password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="bg-green-600 text-white rounded p-3 w-full mt-2 flex justify-center items-center gap-2"
          >
            <FaSave />
            Save
          </button>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="bg-gray-200 rounded p-3 w-full flex justify-center items-center gap-2"
          >
            <FaTimes />
            Cancel
          </button>
        </form>

        {message && <p className="text-center mt-4">{message}</p>}
      </div>
    </main>
  );
}

export default UserInformation;
