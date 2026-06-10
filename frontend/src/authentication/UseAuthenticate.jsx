import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchAPI } from "../api.mjs";
import { useNavigate } from "react-router";

export const AuthenticationContext = createContext(null);

export function AuthenticationProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("resuming");

  // Reload user state from auth key in local storage on page reload
  useEffect(() => {
    const authenticationKey = localStorage.getItem("auth-key");

    if (authenticationKey) {
      fetchAPI("GET", "/user/self", null, authenticationKey)
        .then((response) => {
          if (response.status === 200) {
            // Save user along with their authentication key context
            setUser({ ...response.body, authenticationKey });
            setStatus("loaded");
          } else {
            localStorage.removeItem("auth-key");
            setStatus("logged out");
          }
        })
        .catch((error) => {
          setStatus("Error resuming session: " + error.message);
        });
    } else {
      setStatus("logged out");
    }
  }, []);

  return (
    <AuthenticationContext.Provider value={{ user, setUser, status, setStatus }}>
      {children}
    </AuthenticationContext.Provider>
  );
}

export function useAuthenticate(restrictToRoles = null) {
  const context = useContext(AuthenticationContext);
  const navigate = useNavigate();

  if (!context) {
    throw new Error("useAuthenticate must be used within an AuthenticationProvider");
  }

  const { user, setUser, status, setStatus } = context;

  // Loads user data from the server using the GET /user/self endpoint
  const getUser = useCallback(
    (authenticationKey) => {
      if (!authenticationKey) return;
      
      setStatus("loading");
      return fetchAPI("GET", "/user/self", null, authenticationKey)
        .then((response) => {
          if (response.status === 200) {
            setUser({ ...response.body, authenticationKey });
            setStatus("loaded");
            return response.body;
          } else {
            setStatus(response.body?.message || "Failed to load user information");
            return null;
          }
        })
        .catch((error) => {
          setStatus(error.message);
          return null;
        });
    },
    [setUser, setStatus],
  );

  // Authenticates an email/password combination against the JSON endpoint
  const login = useCallback(
    (email, password) => {
      const body = { email, password };
      setStatus("authenticating");

      fetchAPI("POST", "/authenticate", body)
        .then((response) => {
          if (response.status === 200) {
            const tokenKey = response.body.key;
            localStorage.setItem("auth-key", tokenKey);
            // FIX: Let getUser handle updating the status to "loaded" naturally when it's done!
            getUser(tokenKey); 
          } else {
            setStatus(response.body?.message || "Authentication failed");
          }
        })
        .catch((error) => {
          setStatus(error.message);
        });
    },
    [setStatus, getUser],
  );

  // Clears user sessions natively
  const logout = useCallback(() => {
    const token = user?.authenticationKey || localStorage.getItem("auth-key");
    
    fetchAPI("DELETE", "/authenticate", null, token)
      .finally(() => {
        setUser(null);
        localStorage.removeItem("auth-key");
        setStatus("logged out");
        navigate("/");
      });
  }, [user, setUser, setStatus, navigate]); // FIX: Added proper tracking dependencies here

  // Refresh helper function 
  const refresh = useCallback(() => {
    if (user?.authenticationKey) {
      getUser(user.authenticationKey);
    }
  }, [user, getUser]);

  // Global Route Guard Kick-out Logic Hook Execution
  useEffect(() => {
    // Only kick someone out if the route explicitly passes down restriction rules
    if (
      restrictToRoles && 
      status !== "resuming" && 
      status !== "loading" && 
      (!user || !restrictToRoles.includes(user.role))
    ) {
      navigate("/"); 
    }
  }, [user, status, restrictToRoles, navigate]);

  return {
    user,
    login,
    logout,
    refresh,
    status,
  };
}