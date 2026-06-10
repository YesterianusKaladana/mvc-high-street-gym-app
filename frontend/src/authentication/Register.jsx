import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { fetchAPI } from "../api.mjs";
import validator from "validator";

function Register() {
  const [first_name, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const submitUser = useCallback(() => {
    setLoading(true);
    setStatus("");
    setValidationErrors({}); // Clear previous validation blocks on fresh trigger

    const errors = {};
    if (!/^[a-zA-Z\-'\s]{2,}$/.test(first_name)) {
      errors.first_name = "Missing or invalid first name";
    }
    if (!/^[a-zA-Z\-'\s]{1,}$/.test(lastName)) {
      errors.lastName = "Missing or invalid last name";
    }
    if (!validator.isEmail(email)) {
      errors.email = "Missing or invalid email";
    }
    // Simple verification check to ensure password field is populated
    if (!password || password.length < 4) {
      errors.password = "Password must be at least 4 characters long";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setLoading(false);
      return;
    }

    fetchAPI("POST", "/user", {
      first_name: first_name,
      last_name: lastName,
      email: email,
      password: password,
      role: "member",
    })
      .then((response) => {
        if (response.status === 200 || response.status === 201) {
          navigate("/");
        } else {
          setStatus("Failed to create user - " + (response.body?.message || "Unknown Error"));
          setLoading(false);
        }
      })
      .catch((error) => {
        setStatus("Failed to create user - " + error.message);
        setLoading(false);
      });
  }, [first_name, lastName, email, password, navigate]); // FIX: Added missing form state variables to dependency tracker array

  return (
    <section className="flex justify-center items-center min-h-screen bg-base-200 px-4">
      <div className="card w-full max-w-md shadow-xl bg-base-100 p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          Join High Street Gym
        </h1>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submitUser();
          }}
        >
          <label className="form-control w-full">
            <span className="label-text">First Name</span>
            <input
              value={first_name}
              onChange={(e) => setFirstName(e.target.value)}
              type="text"
              placeholder="John"
              className={`input input-bordered w-full ${validationErrors.first_name ? 'input-error' : ''}`}
              disabled={loading}
            />
            {validationErrors.first_name && (
              <p className="text-error text-xs mt-1">{validationErrors.first_name}</p>
            )}
          </label>

          <label className="form-control w-full">
            <span className="label-text">Last Name</span>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              type="text"
              placeholder="Doe"
              className={`input input-bordered w-full ${validationErrors.lastName ? 'input-error' : ''}`}
              disabled={loading}
            />
            {validationErrors.lastName && (
              <p className="text-error text-xs mt-1">{validationErrors.lastName}</p>
            )}
          </label>

          <label className="form-control w-full">
            <span className="label-text">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="john@example.com"
              className={`input input-bordered w-full ${validationErrors.email ? 'input-error' : ''}`}
              disabled={loading}
            />
            {validationErrors.email && (
              <p className="text-error text-xs mt-1">{validationErrors.email}</p>
            )}
          </label>

          <label className="form-control w-full">
            <span className="label-text">Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              className={`input input-bordered w-full ${validationErrors.password ? 'input-error' : ''}`}
              disabled={loading}
            />
            {validationErrors.password && (
              <p className="text-error text-xs mt-1">{validationErrors.password}</p>
            )}
          </label>

          <label className="form-control w-full">
            <span className="label-text">Role</span>
            <input
              type="text"
              value="member"
              className="input input-bordered w-full bg-base-200 cursor-not-allowed"
              readOnly
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-success w-full mt-4 text-white"
          >
            {loading ? <span className="loading loading-spinner"></span> : "Become a Member"}
          </button>

          {status && (
            <div className="alert alert-error mt-2 py-2 shadow-sm rounded-md">
              <span className="text-sm">{status}</span>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

export default Register;