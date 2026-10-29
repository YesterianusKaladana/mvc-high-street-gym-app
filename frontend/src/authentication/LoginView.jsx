
// Import React hooks, login and register icons, authentication hook, and navigation
import { useCallback, useEffect, useState } from "react";
import { CiLogin } from "react-icons/ci";
import { FaRegistered } from "react-icons/fa";
import { useAuthenticate } from "./UseAuthenticate";
import { useNavigate } from "react-router";

function LoginView() {
  // Used to redirect the user to another page
  const navigate = useNavigate();

  // Store the email and password entered by the user
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Get the login function, current status, and authenticated user
  const { login, status, user } = useAuthenticate();

  // Handle form submission and attempt to log the user in
  const onLoginSubmit = useCallback(
    (e) => {
      // Prevent the browser from refreshing the page
      e.preventDefault();

      // Send the email and password to the authentication function
      login(email, password);
    },
    [email, password, login]
  );

  // Redirect the user to the correct page after successful login
  useEffect(() => {
    if (user) {
      // Members go to the timetable page
      if (user.role === "member") {
        navigate("/timetable");
      }
      // Trainers go to the session management page
      else if (user.role === "trainer") {
        navigate("/session");
      }
    }
  }, [user, navigate]);

  // Check whether the login request is currently running
  const isAuthenticating = status === "authenticating";

  return (
    // Centre the login card on the page
    <section className="flex justify-center items-center min-h-screen bg-base-200 p-4">
      <div className="card w-full max-w-md min-h-[500px] sm:min-h-[560px] bg-base-100 shadow-xl">
        <div className="card-body flex justify-center">
          {/* Display the login page title */}
          <h1 className="text-3xl font-bold text-center mb-6">
            Login
          </h1>

          {/* Submit the login form when the user clicks Login */}
          <form
            onSubmit={onLoginSubmit}
            className="flex flex-col flex-1 justify-center gap-4"
          >
            {/* Email input field */}
            <label className="form-control w-full">
              <span className="label-text mb-2">Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="your@email.com"
                className="input input-bordered w-full"
                disabled={isAuthenticating}
                required
              />
            </label>

            {/* Password input field */}
            <label className="form-control w-full">
              <span className="label-text mb-2">Password</span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="input input-bordered w-full"
                disabled={isAuthenticating}
                required
              />
            </label>

            {/* Display an error message when login fails */}
            {status && status !== "loaded" && !isAuthenticating && (
              <div className="alert alert-error py-2 text-sm rounded-lg">
                <span>{status}</span>
              </div>
            )}

            {/* Display the Login and Register buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              {/* Submit the login form */}
              <button
                type="submit"
                className="btn btn-success flex-1"
                disabled={isAuthenticating}
              >
                {isAuthenticating ? (
                  // Show a loading spinner while logging in
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  // Display the login icon and button text
                  <>
                    <CiLogin className="text-xl" />
                    Login
                  </>
                )}
              </button>

              {/* Navigate to the registration page */}
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="btn btn-outline flex-1"
                disabled={isAuthenticating}
              >
                <FaRegistered className="text-xl" />
                Register
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default LoginView;
