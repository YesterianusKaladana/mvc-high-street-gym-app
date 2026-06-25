import express from "express";
import { BookingModel } from "../models/BookingModel.mjs";
import { AuthenticationController } from "./AuthenticationController.mjs";
import { SessionActivityModel } from "../models/SessionActivityModel.mjs";
import { LocationModel } from "../models/LocationModel.mjs";
import { ActivityModel } from "../models/ActivityModel.mjs";
import { UserModel } from "../models/UserModel.mjs";

/**
 * BookingController
 *
 * Handles booking system for:
 * - Members (create/update/delete own bookings)
 * - Admin (full booking management)
 * - Booking confirmation flow
 *
 * Responsibilities:
 * - Session booking creation
 * - Booking updates and cancellations
 * - Admin booking management
 * - Session selection for confirmation page
 */
export class BookingController {
  static routes = express.Router();

  static {
    /**
     * Member booking list page
     */
    this.routes.get(
      "/member",
      AuthenticationController.restrict(["member"]),
      this.viewMemberBooking,
    );

    /**
     * Member booking confirmation page
     */
    this.routes.get(
      "/member/confirm/:id",
      AuthenticationController.restrict(["member"]),
      this.viewMemberBookingConfirm,
    );

    this.routes.post(
      "/member/confirm/:id",
      AuthenticationController.restrict(["member"]),
      this.handleConfirmBooking,
    );

    /**
     * Member booking CRUD handler
     */
    this.routes.post(
      "/member",
      AuthenticationController.restrict(["member"]),
      this.handleMemberBooking,
    );

    /**
     * Admin booking management page
     */
    this.routes.get(
      "/",
      AuthenticationController.restrict(["admin"]),
      this.viewAdminBooking,
    );

    /**
     * Admin booking CRUD handler
     */
    this.routes.post(
      "/",
      AuthenticationController.restrict(["admin"]),
      this.handleBookingManagement,
    );
  }

  /**
   * Member booking page view
   * @type {express.RequestHandler}
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static async viewMemberBooking(req, res) {
    try {
      const user = req.user;

      const bookings = await BookingModel.getByUserId(user.id);
      const sessions = await SessionActivityModel.getAll();

      const enriched = bookings.map((b) => {
        const session = sessions.find((s) => s.session.id === b.sessionId);

        return {
          ...b,
          session: session || null,
        };
      });

      const editId = req.query.edit;

      let selectedBooking = null;

      if (editId) {
        selectedBooking = await BookingModel.getById(editId);
      }

      return res.render("bookings.ejs", {
        bookings: enriched,
        sessions,
        selectedBooking,
        user,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Error",
        message: "Failed to load bookings",
      });
    }
  }

  /**
   * Booking confirmation page
   * @type {express.RequestHandler}
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static async viewMemberBookingConfirm(req, res) {
    try {
      const user = req.user;
      const sessionId = Number(req.params.id);

      const sessions = await SessionActivityModel.getAll();

      const session = sessions.find((s) => Number(s.session.id) === sessionId);

      if (!session) {
        return res.status(404).render("status.ejs", {
          status: "Error",
          message: "Session not found",
        });
      }

      return res.render("member_book_confirmation.ejs", {
        user,
        session,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Error",
        message: "Failed to load confirmation page",
        returnUrl: "/booking/member/confirm",
      });
    }
  }

  /**
   * Handles booking confirmation from a member for a specific session.
   *
   * This function:
   * - Retrieves the logged-in user from `req.user`
   * - Extracts the session ID from route parameters
   * - Checks if the user already has a booking for the session
   * - Creates a new booking only if it does not already exist
   * - Redirects the user back to the session member page
   *
   * Prevents duplicate bookings for the same user and session.
   *
   * @type {express.RequestHandler}
   * @function handleConfirmBooking
   * @param {import("express").Request} req - Express request object
   * @param {import("express").Response} res - Express response object
   * @returns {Promise<void>} Redirects the user after processing booking
   */
  static async handleConfirmBooking(req, res) {
    try {
      const user = req.user;
      const sessionId = Number(req.params.id);

      // prevent duplicate booking
      const existing = await BookingModel.find(user.id, sessionId);

      if (!existing) {
        await BookingModel.create({
          userId: user.id,
          sessionId,
          created: new Date(),
        });
      }

      return res.redirect("/session/member"); // back to session page
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Error",
        message: "Failed to confirm booking",
        returnUrl: "/session/member",
      });
    }
  }

  /**
   * Member booking CRUD handler
   *
   * Handles:
   * - Create booking
   * - Update booking
   * - Delete booking
   * @type {express.RequestHandler}
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static async handleMemberBooking(req, res) {
    try {
      const user = req.user;

      let { id, userId, sessionId, created, action } = req.body;

      id = id ? Number(id) : null;
      sessionId = Number(sessionId);

      if (action === "delete") {
        await BookingModel.delete(id);
        return res.redirect("/booking/member");
      }

      if (action === "update") {
        await BookingModel.update({
          id,
          sessionId,
          created: new Date(),
          userId: user.id,
        });

        return res.redirect("/booking/member");
      }

      const existing = await BookingModel.find(user.id, sessionId);

      if (existing) {
        return res.redirect("/booking/member");
      }

      await BookingModel.create({
        userId: user.id,
        sessionId,
        created: new Date(),
      });

      return res.redirect("/booking/member");
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Error",
        message: "Failed to manage booking",
        returnUrl: "/booking/member",
      });
    }
  }

  /**
   * Admin booking management view
   * @type {express.RequestHandler}
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static async viewAdminBooking(req, res) {
    try {
      const bookings = await BookingModel.getAll();
      const sessions = await SessionActivityModel.getAll();
      const users = await UserModel.getAll();
      const locations = await LocationModel.getAll();
      const activity = await ActivityModel.getAll();

      const search = (req.query.search || "").toLowerCase();

      let enriched = bookings.map((b) => {
        const session = sessions.find((s) => s.session.id === b.sessionId);
        const member = users.find((u) => u.id === b.userId);

        return {
          ...b,
          session: session || null,
          user: member || null,
        };
      });

      // SEARCH
      if (search) {
        enriched = enriched.filter((b) => {
          const memberName =
            `${b.user?.firstName || ""} ${b.user?.lastName || ""}`.toLowerCase();

          const trainerName =
            `${b.session?.user?.firstName || ""} ${b.session?.user?.lastName || ""}`.toLowerCase();

          const activityName = (b.session?.activity?.name || "").toLowerCase();

          const locationName = (b.session?.location?.name || "").toLowerCase();

          const sessionTime = String(
            b.session?.session?.start_time || "",
          ).toLowerCase();

          return (
            memberName.includes(search) ||
            trainerName.includes(search) ||
            activityName.includes(search) ||
            locationName.includes(search) ||
            sessionTime.includes(search)
          );
        });
      }

      const editId = req.query.edit;

      let selectedBooking = null;

      if (editId) {
        selectedBooking = await BookingModel.getById(editId);
      }

      const members = users.filter(
        (user) => user.role === "member" || user.role === "trainer",
      );

      return res.render("booking_management.ejs", {
        bookings: enriched,
        sessions,
        users: members,
        locations,
        activity,
        selectedBooking,
        user: req.user,
        search: req.query.search || "",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Error",
        message: "Failed to load admin bookings",
        returnUrl: "/booking",
      });
    }
  }

  /**
   * Admin booking CRUD handler
   * @type {express.RequestHandler}
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static async handleBookingManagement(req, res) {
    try {
      let { id, sessionId, userId, action } = req.body;

      id = id ? Number(id) : null;
      sessionId = sessionId ? Number(sessionId) : null;
      userId = userId ? Number(userId) : null;

      // DELETE
      if (action === "delete") {
        await BookingModel.delete(id);
        return res.redirect("/booking?deleted=1");
      }

      // VALIDATION
      if (!userId || !sessionId) {
        return res.redirect("/booking?error=missing_fields");
      }

      // UPDATE
      if (action === "update") {
        console.log("BODY:", req.body);
        await BookingModel.update({
          id,
          sessionId,
          created: new Date(),
          userId,
        });

        return res.redirect("/booking?updated=1");
      }

      // CHECK EXISTING
      const existing = await BookingModel.find(userId, sessionId);

      if (existing) {
        return res.status(409).render("status.ejs", {
          status: "Booking Exists",
          message:
            "This session has already been booked. Double bookings are not allowed.",
          returnUrl: "/booking",
        });
      }

      // CREATE
      await BookingModel.create({
        userId,
        sessionId,
        created: new Date(),
      });

      return res.redirect("/booking?success=1");
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Error",
        message: "Failed to manage booking",
        returnUrl: "/booking",
      });
    }
  }
}
