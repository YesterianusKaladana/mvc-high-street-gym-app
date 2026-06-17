import express from "express";
import { SessionModel } from "../models/SessionModel.mjs";
import { BookingModel } from "../models/BookingModel.mjs";
import { LocationModel } from "../models/LocationModel.mjs";
import { PostModel } from "../models/PostModel.mjs";
import { ActivityModel } from "../models/ActivityModel.mjs";
import { AuthenticationController } from "./AuthenticationController.mjs";
import { SessionActivityModel } from "../models/SessionActivityModel.mjs";
import { BookingActivityModel } from "../models/BookingActivityModel.mjs";
import { UserModel } from "../models/UserModel.mjs";

/**
 * SessionController
 *
 * Handles all session-related features including:
 * - Public timetable view
 * - Admin session management (CRUD)
 * - Trainer session management (CRUD + filtering)
 * - Member session view and booking system
 *
 * Responsibilities:
 * - Session scheduling
 * - Booking management
 * - Role-based session access control
 * - Calendar grouping by day
 */
export class SessionController {
  static routes = express.Router();

  static {
    /**
     * Public timetable view (no restrictions)
     */
    this.routes.get("/view", this.viewPublicTimetable);

    /**
     * Trainer session view
     */
    this.routes.get(
      "/trainer/view",
      AuthenticationController.restrict(["trainer"]),
      this.viewTrainerSession,
    );

    /**
     * Trainer session CRUD
     */
    this.routes.post(
      "/trainer",
      AuthenticationController.restrict(["trainer"]),
      this.handleTrainerSession,
    );

    /**
     * Admin session view
     */
    this.routes.get(
      "/",
      AuthenticationController.restrict(["admin"]),
      this.viewSessionManagement,
    );

    /**
     * Admin session CRUD (update/delete by ID)
     */
    this.routes.post(
      "/:id",
      AuthenticationController.restrict(["admin"]),
      this.handleSessionManagement,
    );

    /**
     * Admin session CRUD (create)
     */
    this.routes.post(
      "/",
      AuthenticationController.restrict(["admin"]),
      this.handleSessionManagement,
    );

    /**
     * Member session view
     */
    this.routes.get(
      "/member/view",
      AuthenticationController.restrict(["member"]),
      this.viewMemberSession,
    );

    this.routes.get(
      "/member",
      AuthenticationController.restrict(["member"]),
      this.viewMemberSession,
    );

    /**
     * Member booking action (book session)
     */
    this.routes.post(
      "/book/:id",
      AuthenticationController.restrict(["member"]),
      this.handleMemberSession,
    );

    /**
     * Member booking action (cancel session)
     */
    this.routes.post(
      "/cancel/:id",
      AuthenticationController.restrict(["member"]),
      this.handleMemberSession,
    );
  }

  /**
   * Public timetable view
   * Displays sessions grouped by weekday and blog posts by weekday
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static async viewPublicTimetable(req, res) {
    try {
      const user = req.user || null;
      const sessions = await SessionActivityModel.getAll();
      // Booked sessions for current user (if logged in)
      let bookedSessionIds = [];

      if (user?.id) {
        const bookings = await BookingModel.getByUserId(user.id);
        bookedSessionIds = bookings.map((b) => Number(b.sessionId));
      }

      // Group sessions by weekday
      const sessionByDay = {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: [],
      };

      const now = new Date();

      sessions.forEach((item) => {
        const s = item.session;
        if (!s?.date) return;

        // --- weekday grouping ---
        const day = new Date(s.date).toLocaleDateString("en-AU", {
          weekday: "long",
        });

        if (!sessionByDay[day]) return;

        // --- normalize date ---
        const cleanDate =
          s.date instanceof Date
            ? s.date.toISOString().split("T")[0]
            : s.date.split("T")[0];

        // --- FIXED EXPIRY LOGIC (timezone-safe) ---
        const dateStr = new Date(s.date).toISOString().split("T")[0];

        const [hh, mm] = (s.end_time || "00:00").slice(0, 5).split(":");

        const sessionEnd = new Date(dateStr);
        sessionEnd.setHours(Number(hh), Number(mm), 0, 0);

        const isExpired = sessionEnd.getTime() < now.getTime();

        // --- push session ---
        sessionByDay[day].push({
          session_id: s.id,
          activity_name: item.activity.name,
          location_name: item.location.name,
          start_time: s.start_time,
          end_time: s.end_time,
          date: cleanDate,
          trainer_name: item.user.firstName + " " + item.user.lastName,
          isExpired,
          isBooked: bookedSessionIds.includes(s.id),
        });
      });

      return res.render("timetable.ejs", {
        user,
        sessionByDay,
        bookedSessionIds,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Error",
        message: "Failed to load sessions",
      });
    }
  }

  /**
   *  View Admin Manage sessions Page
   * @type {express.RequestHandler}
   *
   */
  static async viewSessionManagement(req, res) {
    try {
      const editId = req.query.edit_id;

      // =========================
      // CLEAN QUERY PARAMS
      // =========================
      const clean = (v) => (v && v.trim() !== "" ? v : null);

      const search = clean(req.query.search);
      const trainer = clean(req.query.trainer);
      const activity = clean(req.query.activity);
      const location = clean(req.query.location);
      const date = clean(req.query.date);
      const start_time = clean(req.query.start_time);
      const end_time = clean(req.query.end_time);
      const capacity = clean(req.query.capacity);

      let sessions = await SessionActivityModel.getAll();

      // =========================
      // GLOBAL SEARCH
      // =========================
      if (search) {
        const q = search.toLowerCase();

        sessions = sessions.filter((s) => {
          const trainerName =
            `${s.user?.firstName || ""} ${s.user?.lastName || ""}`.toLowerCase();

          const sessionDate = (s.session?.date || "").toString().slice(0, 10);

          return (
            trainerName.includes(q) ||
            (s.activity?.name || "").toLowerCase().includes(q) ||
            (s.location?.name || "").toLowerCase().includes(q) ||
            sessionDate.includes(q)
          );
        });
      }

      // =========================
      // INDIVIDUAL FILTERS
      // =========================

      if (trainer) {
        sessions = sessions.filter((s) =>
          `${s.user?.firstName || ""} ${s.user?.lastName || ""}`
            .toLowerCase()
            .includes(trainer.toLowerCase()),
        );
      }

      if (activity) {
        sessions = sessions.filter((s) =>
          (s.activity?.name || "")
            .toLowerCase()
            .includes(activity.toLowerCase()),
        );
      }

      if (location) {
        sessions = sessions.filter((s) =>
          (s.location?.name || "")
            .toLowerCase()
            .includes(location.toLowerCase()),
        );
      }

      // =========================
      // DATE FILTER (FIXED)
      // =========================
      if (date) {
        sessions = sessions.filter((s) => {
          if (!s.session?.date) return false;

          const sessionDate = new Date(s.session.date)
            .toISOString()
            .split("T")[0];

          return sessionDate === date;
        });
      }

      // =========================
      // TIME FILTERS
      // =========================
      if (start_time) {
        sessions = sessions.filter(
          (s) => (s.session?.start_time || "").slice(0, 5) === start_time,
        );
      }

      if (end_time) {
        sessions = sessions.filter(
          (s) => (s.session?.end_time || "").slice(0, 5) === end_time,
        );
      }

      // =========================
      // CAPACITY FILTER
      // =========================
      if (capacity) {
        sessions = sessions.filter(
          (s) => Number(s.session?.capacity) === Number(capacity),
        );
      }

      // =========================
      // FORMAT FOR UI ONLY
      // =========================
      const cleanSessions = sessions.map((item) => ({
        ...item,
        session: {
          ...item.session,
          date: item.session?.date
            ? new Date(item.session.date).toISOString().split("T")[0]
            : "",
        },
      }));

      // =========================
      // EDIT SESSION
      // =========================
      let selectedSession = null;

      if (editId) {
        const found = cleanSessions.find((item) => item.session.id == editId);

        if (found) {
          selectedSession = {
            session: found.session,
            activity: found.activity,
            location: found.location,
            user: found.user,
          };
        }
      }

      // =========================
      // USERS (TRAINERS ONLY)
      // =========================
      const allUsers = await UserModel.getAll();
      const users = allUsers.filter((u) => u.role === "trainer");

      // =========================
      // RENDER
      // =========================
      return res.render("session_management.ejs", {
        user: req.user,
        sessions: cleanSessions,
        selectedSession,
        locations: await LocationModel.getAll(),
        activities: await ActivityModel.getAll(),
        users,

        search,
        trainer,
        activity,
        location,
        date,
        start_time,
        end_time,
        capacity,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Internal Server Error",
        message: "Failed to load admin sessions",
        returnUrl: "/session",
      });
    }
  }

  /**
   * Admin CRUD handler for sessions
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static async handleSessionManagement(req, res) {
    const selectedSessionId = req.params.id;
    const { date, start_time, end_time, capacity, action } = req.body;

    try {
      if (action === "create" || action === "update") {
        const startDateTime = new Date(`${date}T${start_time}`);
        const endDateTime = new Date(`${date}T${end_time}`);
        const now = new Date();

        // Block only if session start is before now
        if (startDateTime < now) {
          return res.status(400).render("status.ejs", {
            status: "Validation Error",
            message: "Session start time cannot be in the past",
            returnUrl: "/session",
          });
        }

        // End must be after start
        if (endDateTime <= startDateTime) {
          return res.status(400).render("status.ejs", {
            status: "Validation Error",
            message: "End time must be after start time",
            returnUrl: "/session",
          });
        }

        // Capacity check
        if (Number(capacity) < 1) {
          return res.status(400).render("status.ejs", {
            status: "Validation Error",
            message: "Capacity must be at least 1",
            returnUrl: "/session",
          });
        }
      }

      // CREATE
      if (action === "create") {
        await SessionModel.create(req.body);
      }

      // UPDATE
      if (action === "update") {
        await SessionModel.update({
          id: selectedSessionId,
          ...req.body,
        });
      }

      // DELETE
      if (action === "delete") {
        await SessionModel.delete(selectedSessionId);
      }

      return res.redirect("/session");
    } catch (error) {
      console.error(error);

      return res.status(500).render("status.ejs", {
        status: "Server Error",
        message: "Something went wrong while processing the session",
        returnUrl: "/session",
      });
    }
  }

  /**
   * Trainer session view with filtering
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static async viewTrainerSession(req, res) {
    try {
      const user = req.user;
      const editId = req.query.edit_id;

      const {
        activity,
        location,
        trainer,
        date,
        start_time,
        end_time,
        capacity,
      } = req.query;

      let sessions = await SessionActivityModel.getByUserId(user.id);

      if (activity) {
        sessions = sessions.filter((s) =>
          s.activity.name.toLowerCase().includes(activity.toLowerCase()),
        );
      }

      if (location) {
        sessions = sessions.filter((s) =>
          s.location.name.toLowerCase().includes(location.toLowerCase()),
        );
      }

      if (trainer) {
        const fullName = `${s.user.firstName} ${s.user.lastName}`.toLowerCase();

        sessions = sessions.filter((s) =>
          fullName.includes(trainer.toLowerCase()),
        );
      }

      if (date) {
        sessions = sessions.filter(
          (s) => (s.session.date || "").toString().slice(0, 10) === date,
        );
      }

      if (start_time) {
        sessions = sessions.filter(
          (s) =>
            (s.session.start_time || "").toString().slice(0, 10) === start_time,
        );
      }

      if (end_time) {
        sessions = sessions.filter(
          (s) =>
            (s.session.end_time || "").toString().slice(0, 10) === end_time,
        );
      }

      if (capacity) {
        sessions = sessions.filter((s) => s.session.capacity == capacity);
      }

      const cleanSessions = sessions.map((item) => ({
        ...item,
        session: {
          ...item.session,
          date: item.session.date
            ? new Date(item.session.date).toLocaleDateString("en-CA")
            : "",
        },
      }));

      let selectedSession = null;

      if (editId) {
        const found = cleanSessions.find((item) => item.session.id == editId);

        if (found) {
          selectedSession = {
            session: found.session,
            activity: found.activity,
            location: found.location,
            user: found.user,
          };
        }
      }

      return res.render("trainer_session.ejs", {
        user,
        sessions: cleanSessions,
        selectedSession,
        locations: await LocationModel.getAll(),
        activities: await ActivityModel.getAll(),
        activity,
        location,
        trainer,
        date,
        start_time,
        end_time,
        capacity,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Internal Server Error",
        message: "Failed to load trainer sessions",
        returnUrl: "/session/trainer",
      });
    }
  }

  /**
   * Trainer session CRUD handler
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static async handleTrainerSession(req, res) {
    const trainerId = req.user.id;

    const { action, session_id, date, start_time, end_time, capacity } =
      req.body;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sessionDate = new Date(date);
      sessionDate.setHours(0, 0, 0, 0);

      if (sessionDate < today) {
        return res.status(400).render("status.ejs", {
          status: "Bad Request",
          message: "Cannot create session in the past",
        });
      }

      //Capacity Validation
      if (Number(capacity) < 1) {
        return res.status(400).render("status.ejs", {
          status: "Invalid Capacity",
          message: "Capacity  cannot be 0 must be higher than 0",
        });
      }

      if (action === "create") {
        await SessionModel.create({
          user_id: trainerId,
          location_id: req.body.location_id,
          activity_id: req.body.activity_id,
          date,
          start_time,
          end_time,
          capacity,
        });
      }

      if (action === "update") {
        const existing = await SessionModel.getById(session_id);

        if (!existing) {
          return res.status(404).send("Session not found");
        }

        if (existing.user_id !== trainerId) {
          return res.status(403).send("Not allowed");
        }

        if (sessionDate < today) {
          return res.status(400).send("Cannot move session to past date");
        }

        await SessionModel.update({
          id: session_id,
          user_id: trainerId,
          location_id: req.body.location_id,
          activity_id: req.body.activity_id,
          date,
          start_time,
          end_time,
          capacity,
        });
      }

      if (action === "delete") {
        const existing = await SessionModel.getById(session_id);

        if (!existing) {
          return res.status(404).send("Session not found");
        }

        if (existing.user_id !== trainerId) {
          return res.status(403).send("Not allowed");
        }

        await SessionModel.delete(session_id);
      }
      return res.redirect("/session/trainer/view");
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Internal Server Error",
        message: "Failed to process session",
      });
    }
  }

  /**
   * Member session view with booking status
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static async viewMemberSession(req, res) {
    try {
      const user = req.user;

      const sessions = await SessionActivityModel.getAll();

      const bookings = await BookingModel.getByUserId(user.id);
      const bookedSessionIds = bookings.map((b) => Number(b.sessionId));

      const sessionByDay = {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: [],
      };

      sessions.forEach((item) => {
        if (!item.session?.date) return;

        const day = new Date(item.session.date).toLocaleDateString("en-AU", {
          weekday: "long",
        });

        if (!sessionByDay[day]) return;

        const rawDate = item.session.date;

        let cleanDate = "";

        if (rawDate instanceof Date) {
          cleanDate = rawDate.toISOString().split("T")[0];
        } else if (typeof rawDate === "string") {
          cleanDate = rawDate.split("T")[0];
        }

        sessionByDay[day].push({
          session_id: item.session.id,
          activity_name: item.activity.name,
          location_name: item.location.name,
          start_time: item.session.start_time,
          end_time: item.session.end_time,
          date: cleanDate,
          trainer_name: item.user.firstName + " " + item.user.lastName,
          isBooked: bookedSessionIds.includes(item.session.id),
        });
      });

      return res.render("member_session.ejs", {
        user,
        sessionByDay,
        bookedSessionIds,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Internal Server Error",
        message: "Failed to load member sessions",
      });
    }
  }

  /**
   * Member booking handler (book/cancel sessions)
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static async handleMemberSession(req, res) {
    try {
      const userId = req.user.id;
      const sessionId = req.params.id;

      if (req.path.includes("/book/")) {
        const existing = await BookingModel.find(userId, sessionId);

        if (existing) {
          return res.status(400).render("status.ejs", {
            status: "Bad Request",
            message: "You already booked this session",
          });
        }

        const targetSession = await SessionModel.getById(sessionId);

        if (!targetSession) {
          return res.status(404).render("status.ejs", {
            status: "Not Found",
            message: "Session not found",
          });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sessionDate = new Date(targetSession.date);
        sessionDate.setHours(0, 0, 0, 0);

        if (sessionDate < today) {
          return res.status(422).render("status.ejs", {
            status: "Invalid Booking ",
            message: "Cannot book previous dates",
          });
        }

        const user = req.user;

        await BookingModel.create({
          sessionId,
          created: new Date(),
          customerFirstName: user.firstName,
          customerLastName: user.lastName,
          customerEmail: user.email,
          userId,
        });

        return res.redirect("/booking/member");
      }

      if (req.path.includes("/cancel/")) {
        const booking = await BookingModel.find(userId, sessionId);

        if (!booking) {
          return res.status(404).render("status.ejs", {
            status: "Not Found",
            message: "Booking not found",
          });
        }

        await BookingModel.delete(booking.id);
      }

      return res.redirect("/session/member/view");
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Internal Server Error",
        message: "Member booking error",
      });
    }
  }
}
