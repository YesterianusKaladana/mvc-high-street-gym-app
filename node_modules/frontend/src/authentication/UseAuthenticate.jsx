
import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { fetchAPI } from "../api.mjs"
import { useNavigate } from "react-router"

export const AuthenticationContext = createContext(null)

export function AuthenticationProvider({ children }) {
  // User and status state to be shared via context
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState("resuming")

  // Attempt to reload user from auth-key saved in local storage
  useEffect(() => {
    const authenticationKey = localStorage.getItem("auth-key")

    if (authenticationKey) {
      fetchAPI("GET", "/user/self", null, authenticationKey)
        .then(response => {
          if (response.status == 200) {
            setUser(response.body)
            setStatus("loaded")
          } else {
            localStorage.removeItem("auth-key")
            setUser(null)
            setStatus(response.body?.message || "Failed to load user")
          }
        })
        .catch(error => {
          localStorage.removeItem("auth-key")
          setUser(null)
          setStatus(String(error))
        })
    } else {
      setStatus(null)
    }
  }, [setUser, setStatus])

  // Provide user and status state to all children via context
  return (
    <AuthenticationContext.Provider value={[user, setUser, status, setStatus]}>
      {children}
    </AuthenticationContext.Provider>
  )
}

export function useAuthenticate(restrictToRoles = null) {
  const [user, setUser, status, setStatus] = useContext(AuthenticationContext)

  const navigate = useNavigate()

  const getUser = useCallback((authenticationKey) => {
    if (authenticationKey) {
      setStatus("loading")

      fetchAPI("GET", "/user/self", null, authenticationKey)
        .then(response => {
          if (response.status == 200) {
            setUser(response.body)
            setStatus("loaded")
          } else {
            localStorage.removeItem("auth-key")
            setUser(null)
            setStatus(response.body?.message || "Failed to load user")
          }
        })
        .catch(error => {
          localStorage.removeItem("auth-key")
          setUser(null)
          setStatus(String(error))
        })
    }
  }, [setUser, setStatus])

  const login = useCallback((email, password) => {
    const body = {
      email,
      password
    }

    setStatus("authenticating")

    fetchAPI("POST", "/authenticate", body)
      .then(response => {
        if (response.status == 200) {
          const authenticationKey = response.body.authenticationKey

          localStorage.setItem("auth-key", authenticationKey)
          getUser(authenticationKey)
        } else {
          setStatus(response.body?.message || "Authentication failed")
        }
      })
      .catch(error => {
        setStatus(String(error))
      })
  }, [setStatus, getUser])

  const logout = useCallback(() => {
    const authenticationKey = localStorage.getItem("auth-key")

    fetchAPI("DELETE", "/authenticate", null, authenticationKey)
      .then(() => {
        setUser(null)
        localStorage.removeItem("auth-key")
        setStatus(null)
        navigate("/")
      })
      .catch(() => {
        setUser(null)
        localStorage.removeItem("auth-key")
        setStatus(null)
        navigate("/")
      })
  }, [setUser, setStatus, navigate])

  const refresh = useCallback(() => {
    const authenticationKey = localStorage.getItem("auth-key")

    if (authenticationKey) {
      getUser(authenticationKey)
    }
  }, [getUser])

  // Check whether the user has permission to access the page
  useEffect(() => {
    if (
      restrictToRoles &&
      status !== "resuming" &&
      status !== "loading" &&
      status !== "authenticating" &&
      (!user || !restrictToRoles.includes(user.role))
    ) {
      navigate("/")
    }
  }, [user, status, restrictToRoles, navigate])

  return {
    user,
    login,
    logout,
    refresh,
    status
  }
}
