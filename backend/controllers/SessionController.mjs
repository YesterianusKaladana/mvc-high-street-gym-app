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

      // =========================
      // BOOKED SESSIONS
      // =========================
      let bookedSessionIds = [];

      if (user?.id) {
        const bookings = await BookingModel.getById(user.id);
        bookedSessionIds = bookings.map((b) => Number(b.sessionId));
      }

      // =========================
      // SESSION GROUPING + FIXED EXPIRY
      // =========================
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
   * Admin session management view
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static async viewSessionManagement(req, res) {
    try {
      const editId = req.query.edit_id;

      // =========================
      // SEARCH FIELDS
      // =========================
      const {
        search,
        trainer,
        activity,
        location,
        date,
        start_time,
        end_time,
        capacity,
      } = req.query;

      let sessions = await SessionActivityModel.getAll();

      // =========================
      //  SEARCH (ALL FIELDS)
      // =========================
      if (search) {
        const q = search.toLowerCase();

        sessions = sessions.filter((s) => {
          const trainerName =
            `${s.user.firstName} ${s.user.lastName}`.toLowerCase();

          return (
            trainerName.includes(q) ||
            s.activity.name.toLowerCase().includes(q) ||
            s.location.name.toLowerCase().includes(q) ||
            (s.session.date || "").toString().toLowerCase().includes(q)
          );
        });
      }

      // =========================
      // FIELD FILTERS
      // =========================

      if (trainer) {
        sessions = sessions.filter((s) =>
          `${s.user.firstName} ${s.user.lastName}`
            .toLowerCase()
            .includes(trainer.toLowerCase()),
        );
      }

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

      if (date) {
        sessions = sessions.filter(
          (s) => (s.session.date || "").toString().slice(0, 10) === date,
        );
      }

      if (start_time) {
        sessions = sessions.filter(
          (s) => (s.session.start_time || "").slice(0, 5) === start_time,
        );
      }

      if (end_time) {
        sessions = sessions.filter(
          (s) => (s.session.end_time || "").slice(0, 5) === end_time,
        );
      }

      if (capacity) {
        sessions = sessions.filter(
          (s) => Number(s.session.capacity) === Number(capacity),
        );
      }

      // =========================
      // CLEAN FORMAT
      // =========================
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

      const allUsers = await UserModel.getAll();
      const users = allUsers.filter((u) => u.role === "trainer");

      return res.render("session_management.ejs", {
        user: req.user,
        sessions: cleanSessions,
        selectedSession,
        locations: await LocationModel.getAll(),
        activities: await ActivityModel.getAll(),
        users,

        // return filters back to UI
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
      return res.status(500).send("Failed to load admin sessions");
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
          });
        }

        // End must be after start
        if (endDateTime <= startDateTime) {
          return res.status(400).render("status.ejs", {
            status: "Validation Error",
            message: "End time must be after start time",
          });
        }

        // Capacity check
        if (Number(capacity) < 1) {
          return res.status(400).render("status.ejs", {
            status: "Validation Error",
            message: "Capacity must be at least 1",
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
      return res.status(500).send("Failed to load trainer sessions");
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
        return res.status(400).send("Cannot create session in the past");
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
      console.error(error + "Something went wrong while processing session");
      return res.redirect("/session/trainer/view");
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

      const bookings = await BookingModel.getByUser(user.id);
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
        status: "Error",
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
          return res.status(400).send("You already booked this session");
        }

        const targetSession = await SessionModel.getById(sessionId);

        if (!targetSession) {
          return res.status(404).send("Session not found");
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sessionDate = new Date(targetSession.date);
        sessionDate.setHours(0, 0, 0, 0);

        if (sessionDate < today) {
          return res.status(400).send("Cannot book previous dates");
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
          return res.status(404).send("Booking not found");
        }

        await BookingModel.delete(booking.id);
      }

      return res.redirect("/session/member/view");
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Error",
        message: "Member booking error",
      });
    }
  }
}
