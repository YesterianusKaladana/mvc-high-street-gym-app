import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { fetchAPI } from "../api.mjs";
import { useNavigate } from "react-router";

export const AuthenticationContext = createContext(null);

export function AuthenticationProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("resuming");

  useEffect(() => {
    const authenticationKey = localStorage.getItem("auth-key");

    if (authenticationKey) {
      fetchAPI("GET", "/user/self", null, authenticationKey)
        .then((response) => {
          if (response.status === 200) {
            setUser(response.body);
            setStatus("loaded");
          } else {
            localStorage.removeItem("auth-key");
            setStatus("logged out");
          }
        })
        .catch((error) => {
          localStorage.removeItem("auth-key");
          setStatus(String(error));
        });
    } else {
      setStatus("logged out");
    }
  }, []);

  return (
    <AuthenticationContext.Provider
      value={{
        user,
        setUser,
        status,
        setStatus,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
}

export function useAuthenticate(restrictToRoles = null) {
  const context = useContext(AuthenticationContext);
  const navigate = useNavigate();

  if (!context) {
    throw new Error(
      "useAuthenticate must be used within AuthenticationProvider",
    );
  }

  const { user, setUser, status, setStatus } = context;

  const getUser = useCallback(
    (authenticationKey) => {
      if (authenticationKey) {
        setStatus("loading");

        fetchAPI("GET", "/user/self", null, authenticationKey)
          .then((response) => {
            if (response.status === 200) {
              setUser(response.body);
              setStatus("loaded");
            } else {
              localStorage.removeItem("auth-key");
              setUser(null);
              setStatus(response.body?.message || "Failed to load user");
            }
          })
          .catch((error) => {
            setStatus(String(error));
          });
      }
    },
    [setUser, setStatus],
  );

  const login = useCallback(
    (email, password) => {
      setStatus("authenticating");

      fetchAPI("POST", "/authenticate", {
        email,
        password,
      })
        .then((response) => {
          if (response.status === 200) {
            localStorage.setItem(
              "auth-key",
              response.body.authenticationKey,
            );

            getUser(response.body.authenticationKey);
          } else {
            setStatus(response.body?.message || "Authentication failed");
          }
        })
        .catch((error) => {
          setStatus(String(error));
        });
    },
    [setStatus, getUser],
  );

  // Logout — clears server key, clears local state, redirects to /
  const logout = useCallback(() => {
    const authenticationKey = localStorage.getItem("auth-key");

    fetchAPI("DELETE", "/authenticate", null, authenticationKey)
      .finally(() => {
        setUser(null);
        localStorage.removeItem("auth-key");
        setStatus("logged out");
        navigate("/");
      });
  }, [setUser, setStatus, navigate]);

  const refresh = useCallback(() => {
    const authenticationKey = localStorage.getItem("auth-key");

    if (authenticationKey) {
      getUser(authenticationKey);
    }
  }, [getUser]);

  // Role restriction — redirect to / if not authorised
  useEffect(() => {
    if (
      restrictToRoles &&
      status !== "resuming" &&
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