import { useCallback, useEffect, useState } from "react";
import { CiLogin } from "react-icons/ci";
import { FaRegistered } from "react-icons/fa";
import { useAuthenticate } from "./UseAuthenticate";
import { useNavigate } from "react-router";

function LoginView() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, status, user } = useAuthenticate();

  const onLoginSubmit = useCallback(
    (e) => {
      e.preventDefault();
      login(email, password);
    },
    [email, password, login]
  );

  useEffect(() => {
    if (user) {
      if (user.role === "member") {
        navigate("/timetable");
      } else if (user.role === "trainer") {
        navigate("/sessionTrainer");
      }
    }
  }, [user, navigate]);

  const isAuthenticating = status === "authenticating";

  return (
    <section className="flex justify-center items-center min-h-screen bg-base-200 p-4">
      <div className="card w-full max-w-md min-h-[500px] sm:min-h-[560px] bg-base-100 shadow-xl">
        <div className="card-body flex justify-center">
          <h1 className="text-3xl font-bold text-center mb-6">Login</h1>

          <form
            onSubmit={onLoginSubmit}
            className="flex flex-col flex-1 justify-center gap-4"
          >
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

            {/* Error Message */}
            {status && status !== "loaded" && !isAuthenticating && (
              <div className="alert alert-error py-2 text-sm rounded-lg">
                <span>{status}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="submit"
                className="btn btn-success flex-1"
                disabled={isAuthenticating}
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