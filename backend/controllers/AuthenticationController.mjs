import express from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/UserModel.mjs";

/**
 * AuthenticationController
 *
 * Handles:
 * - Session management
 * - User login
 * - User registration
 * - Logout
 * - Role-based access control (RBAC)
 *
 * Responsibilities:
 * - Maintain authentication state via express-session
 * - Load user from session into request object
 * - Protect routes using role restrictions
 */
export class AuthenticationController {
  static middleware = express.Router();
  static routes = express.Router();

  static {
    /**
     * Session configuration middleware
     * Stores user session across requests
     */
    this.middleware.use(
      session({
        secret: "cfa1ee35-bca0-4453-acb8-907c329198b8",
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: false,
        },
      }),
    );

    /**
     * Load authenticated user from session
     */
    this.middleware.use(this.sessionAuth.bind(this));

    /**
     * Login routes
     */
    this.routes.get("/", this.viewAuthenticate);
    this.routes.post("/", this.handleAuthenticate);

    /**
     * Registration routes
     */
    this.routes.get("/register", this.viewRegister);
    this.routes.post("/register", this.handleRegister);

    /**
     * Logout routes
     */
    this.routes.get("/logout", this.handleDeauthenticate);
    this.routes.post("/logout", this.handleDeauthenticate);

    /**
     * Dashboard route (protected)
     */
    this.routes.get(
      "/dashboard",
      this.restrict(["admin", "trainer", "member"]),
      this.viewDashboard,
    );
  }

  /**
   * Loads user from session and attaches it to req.user
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @param {Function} next
   */
  static async sessionAuth(req, res, next) {
    try {
      if (req.session.userId) {
        console.log("SESSION USER ID:", req.session.userId);

        const user = await UserModel.getById(req.session.userId);

        console.log("LOADED USER:", user);

        req.user = user || null;
      } else {
        req.user = null;
      }
    } catch (error) {
      console.error("SESSION AUTH ERROR:", error);
      req.user = null;
    }

    next();
  }

  /**
   * Render login page
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static viewAuthenticate(req, res) {
    return res.render("login.ejs", {
      registered: req.query.registered,
      logout: req.query.logout,
    });
  }

  /**
   * Render registration page
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static viewRegister(req, res) {
    return res.render("register.ejs");
  }

  /**
   * Render dashboard page (protected)
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static viewDashboard(req, res) {
    if (!req.user) {
      return res.redirect("/authenticate/");
    }

    return res.render("dashboard.ejs", {
      user: req.user,
    });
  }

  /**
   * Handle user registration
   *
   * Includes:
   * - input validation
   * - email uniqueness check
   * - password hashing
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static async handleRegister(req, res) {
    try {
      const { firstName, lastName, email, password, role } = req.body;

      const errors = [];

      if (!firstName || firstName.trim().length < 2) {
        errors.push("First name must be at least 2 characters.");
      }

      if (!lastName || lastName.trim().length < 2) {
        errors.push("Last name must be at least 2 characters.");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!email || !emailRegex.test(email)) {
        errors.push("Invalid email address.");
      }

      if (!password || password.length < 8) {
        errors.push("Password must be at least 8 characters.");
      }

      if (errors.length > 0) {
        return res.status(400).render("status.ejs", {
          status: "Validation Error",
          message: errors.join("<br>"),
          returnUrl: "/register",
        });
      }

      const existingUser = await UserModel.getByEmail(email);

      if (existingUser) {
        return res.status(400).render("status.ejs", {
          status: "Error",
          message: "Email already exists",
          returnUrl: "/register",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new UserModel(
        null,
        firstName,
        lastName,
        role || "member",
        email,
        hashedPassword,
      );

      await UserModel.create(newUser);

      console.log("USER REGISTERED:", newUser);

      return res.redirect("/authenticate/?registered=success");
    } catch (error) {
      console.error("REGISTER ERROR:", error);

      return res.status(500).render("status.ejs", {
        status: "Error",
        message: "Registration failed",
        returnUrl: "/register",
      });
    }
  }

  /**
   * Handle user login authentication
   *
   * Includes:
   * - credential validation
   * - password verification
   * - session creation
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static async handleAuthenticate(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).render("status.ejs", {
        status: "Error",
        message: "Email and password are required",
        returnUrl: "/authenticate",
      });
    }

    try {
      const user = await UserModel.getByEmail(email);

      console.log("USER FROM DB:", user);

      if (!user) {
        return res.status(400).render("status.ejs", {
          status: "Login Failed",
          message: "Invalid email or password",
          returnUrl: "/authenticate",
        });
      }

      if (!user.password) {
        return res.status(400).render("status.ejs", {
          status: "Login Failed",
          message: "Invalid email or password",
          returnUrl: "/authenticate",
        });
      }

      const isCorrectPassword = await bcrypt.compare(password, user.password);

      if (!isCorrectPassword) {
        return res.status(400).render("status.ejs", {
          status: "Login Failed",
          message: "Invalid email or password",
          returnUrl: "/authenticate",
        });
      }

      req.session.userId = user.id;
      req.session.role = user.role;

      console.log("SESSION SAVED:");
      console.log(req.session);

      req.session.save((err) => {
        if (err) {
          console.error("SESSION SAVE ERROR:", err);

          return res.status(500).render("status.ejs", {
            status: "Error",
            message: "Session error",
            returnUrl: "/authenticate",
          });
        }

        return res.redirect("/authenticate/dashboard");
      });
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      return res.status(500).render("status.ejs", {
        status: "Error",
        message: "Authentication failed",
        returnUrl: "/authenticate",
      });
    }
  }

  /**
   * Handle user logout and destroy session
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static handleDeauthenticate(req, res) {
    if (!req.session.userId) {
      return res.redirect("/authenticate/");
    }

    req.session.destroy((err) => {
      if (err) {
        console.error("LOGOUT ERROR:", err);

        return res.status(500).render("status.ejs", {
          status: "Error",
          message: "Logout failed",
        });
      }

      return res.redirect("/authenticate/?logout=success");
    });
  }

  /**
   * Role-based access control middleware
   *
   * @param {string[]} roles - Allowed roles
   * @returns {Function} Express middleware
   */
  static restrict(roles) {
    return (req, res, next) => {
      const user = req.user;

      console.log("ROLE CHECK:");
      console.log("USER:", user);
      console.log("USER ROLE:", user?.role);
      console.log("ALLOWED ROLES:", roles);

      if (!user) {
        return res.status(401).render("status.ejs", {
          status: "Login Required",
          message: "Please login first",
        });
      }

      if (!user.role) {
        return res.status(403).render("status.ejs", {
          status: "Access Denied",
          message: "Invalid user role",
        });
      }

      const userRole = user.role.toLowerCase();

      const allowedRoles = roles.map((role) => role.toLowerCase());

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).render("status.ejs", {
          status: "Access Denied",
          message: "You do not have permission",
        });
      }

      next();
    };
  }
}
