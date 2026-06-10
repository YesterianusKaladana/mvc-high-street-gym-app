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
  
  const onLoginSubmit = useCallback((e) => {
    e.preventDefault();
    login(email, password);
  }, [email, password, login]);
  
  useEffect(() => {
    if (user) {
      // FIX: Changed "/LoginView" to "/timetable" to prevent an infinite redirect loop
      if (user.role === "member") {
        navigate("/timetable"); 
      } else if (user.role === "trainer") {
        navigate("/sessionTrainer");
      }
    }
  }, [user, navigate]);

  // UI helper variable for handling loading states cleanly
  const isAuthenticating = status === "authenticating";
  
  return (
    <section className="flex justify-center items-center min-h-screen bg-base-200 px-4">
      <div className="card w-full max-w-md shadow-xl bg-base-100 p-6">
        <h1 className="text-3xl font-bold text-center mb-6">Login</h1>

        <form className="space-y-4" onSubmit={onLoginSubmit}>
          <label className="form-control w-full">
            <span className="label-text">Email</span>
            <input 
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email" 
              placeholder="your@email.com" 
              className="input input-bordered w-full"
              disabled={isAuthenticating}
              required
            />
          </label>

          <label className="form-control w-full">
            <span className="label-text">Password</span>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password" 
              placeholder="••••••••" 
              className="input input-bordered w-full"
              disabled={isAuthenticating}
              required
            />
          </label>

          {/* Dynamic API Error Handling Display */}
          {status && status !== "loaded" && !isAuthenticating && (
            <div className="alert alert-error py-2 text-sm rounded-lg shadow-sm">
              <span>{status}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
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
                  <span className="ml-2">Login</span>
                </>
              )}
            </button>

            <button
              onClick={() => navigate("/register")}
              type="button"
              className="btn btn-outline flex-1"
              disabled={isAuthenticating}
            >
              <FaRegistered className="text-xl" />
              <span className="ml-2">Register</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default LoginView;