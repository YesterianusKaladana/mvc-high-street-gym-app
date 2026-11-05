
import { useCallback, useEffect, useState } from "react";
import { CiLogin } from "react-icons/ci";
import { FaRegistered } from "react-icons/fa";
import { useAuthenticate } from "./UseAuthenticate";
import { useNavigate } from "react-router";

function LoginView() {
  // Used to redirect the user to another page
  const navigate = useNavigate();

  // Store the email, password and agreement status
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Get the login function, current status, and authenticated user
  const { login, status, user } = useAuthenticate();

  // Handle form submission and attempt to log the user in
  const onLoginSubmit = useCallback(
    (e) => {
      // Prevent the browser from refreshing the page
      e.preventDefault();

      // Check whether the user has agreed to the terms
      if (!agreedToTerms) {
        return;
      }

      // Send the email and password to the authentication function
      login(email, password);
    },
    [email, password, agreedToTerms, login]
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
        navigate("/timetable/sessions");
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

            {/* Terms and Conditions agreement checkbox */}
            <label className="flex items-start gap-2 text-sm cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="checkbox checkbox-primary checkbox-sm mt-0.5"
                disabled={isAuthenticating}
                required
              />
              <span>
                By logging in, I agree to the Terms and Conditions of this fitness community.
              </span>
            </label>

            {/* Display the Login and Register buttons */}
            <div className="flex flex-col sm:flex-row gap-5 mt-4">
              {/* Submit the login form */}
              <button
                type="submit"
                className="btn btn-success flex-1"
                disabled={isAuthenticating || !agreedToTerms}
              >
                {isAuthenticating ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
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
                className="btn btn-primary flex-1"
                disabled={isAuthenticating}
              >
                <FaRegistered className="text-xl" />
                Register
              </button>
            </div>
          </form>

          {/* Privacy Policy and Copyright */}
          <div className="text-center mt-8 pt-4 border-t border-base-300">
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="link link-hover text-sm text-base-content/70"
            >
              Privacy Policy
            </a>

            <p className="text-xs text-base-content/50 mt-2">
              &copy; {new Date().getFullYear()} High Street Gym. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LoginView;
