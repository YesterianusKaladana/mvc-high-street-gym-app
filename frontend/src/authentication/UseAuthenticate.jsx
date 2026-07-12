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



  // Resume login session when page reloads
  useEffect(() => {

    const authenticationKey =
      localStorage.getItem("auth-key");


    if (authenticationKey) {

      fetchAPI(
        "GET",
        "/user/self",
        null,
        authenticationKey
      )
        .then((response) => {


          if (response.status === 200) {

            setUser({
              ...response.body,
              authenticationKey,
            });

            setStatus("loaded");

          } else {

            localStorage.removeItem("auth-key");

            setUser(null);

            setStatus("logged out");

          }

        })
        .catch((error) => {

          setStatus(
            "Error resuming session: " + error.message
          );

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


  const context =
    useContext(AuthenticationContext);


  const navigate =
    useNavigate();



  if (!context) {

    throw new Error(
      "useAuthenticate must be used within AuthenticationProvider"
    );

  }



  const {
    user,
    setUser,
    status,
    setStatus,

  } = context;





  // Get current logged-in user
  const getUser = useCallback(

    (authenticationKey) => {


      if (!authenticationKey) {

        return null;

      }



      setStatus("loading");



      return fetchAPI(
        "GET",
        "/user/self",
        null,
        authenticationKey
      )

        .then((response) => {


          if (response.status === 200) {


            setUser({

              ...response.body,

              authenticationKey,

            });



            setStatus("loaded");


            return response.body;



          } else {


            setStatus(
              response.body?.message ||
              "Failed to load user information"
            );


            localStorage.removeItem("auth-key");

            setUser(null);


            return null;

          }


        })


        .catch((error) => {


          setStatus(error.message);

          return null;


        });


    },

    [setUser, setStatus]

  );





  // Login user
  const login = useCallback(

    (email, password) => {


      const body = {

        email,

        password,

      };



      setStatus("authenticating");



      fetchAPI(
        "POST",
        "/authenticate",
        body
      )

        .then((response) => {


          if (response.status === 200) {



            const tokenKey =
              response.body.authenticationKey;



            if (!tokenKey) {


              setStatus(
                "Authentication key missing from server"
              );


              return;

            }



            localStorage.setItem(
              "auth-key",
              tokenKey
            );



            getUser(tokenKey);



          } else {



            setStatus(

              response.body?.message ||

              "Authentication failed"

            );


          }


        })


        .catch((error) => {


          setStatus(error.message);


        });


    },

    [
      setStatus,
      getUser
    ]

  );



  // Logout user
  const logout = useCallback(() => {


    const token =
      user?.authenticationKey ||

      localStorage.getItem("auth-key");



    fetchAPI(
      "DELETE",
      "/authenticate",
      null,
      token
    )

      .finally(() => {


        setUser(null);


        localStorage.removeItem(
          "auth-key"
        );


        setStatus("logged out");


        navigate("/");


      });


  },

    [
      user,
      setUser,
      setStatus,
      navigate
    ]

  );




  // Refresh user information
  const refresh = useCallback(() => {


    if (user?.authenticationKey) {


      getUser(
        user.authenticationKey
      );


    }


  },

    [
      user,
      getUser
    ]

  );



  // Route protection
  useEffect(() => {


    if (

      restrictToRoles &&

      status !== "resuming" &&

      status !== "loading" &&

      (

        !user ||

        !restrictToRoles.includes(user.role)

      )

    ) {

      navigate("/");


    }



  },

    [
      user,
      status,
      restrictToRoles,
      navigate
    ]

  );







  return {

    user,

    login,

    logout,

    refresh,

    status,

  };


}