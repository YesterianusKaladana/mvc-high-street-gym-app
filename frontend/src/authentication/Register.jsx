
// Import React hooks, navigation, API function, and email validator
import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { fetchAPI } from "../api.mjs";
import validator from "validator";

function Register() {
  // Store the user's registration form values
  const [first_name, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Store validation errors for each input field
  const [validationErrors, setValidationErrors] = useState({});

  // Track whether the registration request is running
  const [loading, setLoading] = useState(false);

  // Store the success or error message displayed to the user
  const [status, setStatus] = useState("");

  // Track whether registration was successful
  const [isSuccess, setIsSuccess] = useState(false);

  // Used to redirect the user to another page
  const navigate = useNavigate();

  // Validate the form and send the registration request to the API
  const submitUser = useCallback(() => {
    setLoading(true);
    setStatus("");
    setIsSuccess(false);
    setValidationErrors({});

    // Check that all form values are valid
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

    if (!password || password.length < 4) {
      errors.password = "Password must be at least 4 characters long";
    }

    // Display validation errors and stop if any field is invalid
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setLoading(false);
      return;
    }

    // Send the new member's details to the backend API
    fetchAPI("POST", "/user", {
      firstName: first_name,
      lastName: lastName,
      email: email,
      password: password,
      role: "member",
    })
      .then((response) => {
        // Check whether the account was created successfully
        if (response.status === 200 || response.status === 201) {
          setIsSuccess(true);
          setStatus(
            "Registration successful! Redirecting to login...",
          );
          setLoading(false);

          // Redirect the user to the login page after 2 seconds
          setTimeout(() => {
            navigate("/");
          }, 2000);
        } else {
          // Display an error if the backend cannot create the account
          setStatus(
            "Failed to create user - " +
            (response.body?.message || "Unknown Error"),
          );
          setLoading(false);
        }
      })
      .catch((error) => {
        // Display an error if the API request fails
        setStatus(
          "Failed to create user - " + error.message,
        );
        setLoading(false);
      });
  }, [first_name, lastName, email, password, navigate]);

  return (
    // Centre the registration card on the page
    <section className="flex justify-center items-center min-h-screen bg-base-200 px-4">
      <div className="card w-full max-w-md shadow-xl bg-base-100 p-6">
        {/* Display the registration page title */}
        <h1 className="text-2xl font-bold text-center mb-6">
          Join High Street Gym
        </h1>

        {/* Submit the registration form when the button is clicked */}
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submitUser();
          }}
        >
          {/* First name input and validation message */}
          <label className="form-control w-full">
            <span className="label-text">First Name</span>
            <input
              value={first_name}
              onChange={(e) => setFirstName(e.target.value)}
              type="text"
              placeholder="John"
              className={`input input-bordered w-full ${validationErrors.first_name ? "input-error" : ""
                }`}
              disabled={loading}
            />
            {validationErrors.first_name && (
              <p className="text-error text-xs mt-1">
                {validationErrors.first_name}
              </p>
            )}
          </label>

          {/* Last name input and validation message */}
          <label className="form-control w-full">
            <span className="label-text">Last Name</span>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              type="text"
              placeholder="Doe"
              className={`input input-bordered w-full ${validationErrors.lastName ? "input-error" : ""
                }`}
              disabled={loading}
            />
            {validationErrors.lastName && (
              <p className="text-error text-xs mt-1">
                {validationErrors.lastName}
              </p>
            )}
          </label>

          {/* Email input and email format validation message */}
          <label className="form-control w-full">
            <span className="label-text">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="john@example.com"
              className={`input input-bordered w-full ${validationErrors.email ? "input-error" : ""
                }`}
              disabled={loading}
            />
            {validationErrors.email && (
              <p className="text-error text-xs mt-1">
                {validationErrors.email}
              </p>
            )}
          </label>

          {/* Password input and password validation message */}
          <label className="form-control w-full">
            <span className="label-text">Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              className={`input input-bordered w-full ${validationErrors.password ? "input-error" : ""
                }`}
              disabled={loading}
            />
            {validationErrors.password && (
              <p className="text-error text-xs mt-1">
                {validationErrors.password}
              </p>
            )}
          </label>

          {/* Set the member role automatically; users cannot change it */}
          <label className="form-control w-full">
            <span className="label-text">Role</span>
            <input
              type="text"
              value="member"
              className="input input-bordered w-full bg-base-200 cursor-not-allowed"
              readOnly
            />
          </label>

          {/* Submit the form and prevent duplicate submissions */}
          <button
            type="submit"
            disabled={loading || isSuccess}
            className="btn btn-success w-full mt-4 text-white"
          >
            {loading ? (
              // Show a spinner while the API request is running
              <span className="loading loading-spinner"></span>
            ) : isSuccess ? (
              // Update the button text after successful registration
              "Registration Successful"
            ) : (
              "Become a Member"
            )}
          </button>

          {/* Display a green success message or a red error message */}
          {status && (
            <div
              role="alert"
              className={`alert ${isSuccess ? "alert-success" : "alert-error"
                } mt-2 py-2 shadow-sm rounded-md`}
            >
              <span className="text-sm">{status}</span>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

export default Register;