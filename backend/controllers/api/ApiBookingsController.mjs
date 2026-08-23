import express from "express";
import { ApiAuthenticationController } from "./ApiAuthenticationController.mjs";
import { BookingModel } from "../../models/BookingModel.mjs";
import { DatabaseModel } from "../../models/DatabaseModel.mjs";
import { BookingActivityModel } from "../../models/BookingActivityModel.mjs";

export class ApiBookingsController {
  static routes = express.Router();

  static {
    this.routes.use(ApiAuthenticationController.middleware);

    this.routes.post("/", this.createBooking);

    this.routes.get("/", this.getUserBookings);

    this.routes.get("/xml", this.getMemberBookingXML);

    this.routes.delete("/:id", this.deleteBooking);
  }

  /**
   * Create a new booking
   *
   * @openapi
   * /api/booking:
   *   post:
   *     summary: Create a new booking
   *     tags: [Bookings]
   *     security:
   *       - ApiKey: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - sessionId
   *             properties:
   *               sessionId:
   *                 type: integer
   *                 example: 63
   *     responses:
   *       200:
   *         description: Booking created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - id
   *                 - message
   *               properties:
   *                 id:
   *                   type: integer
   *                   example: 52
   *                 message:
   *                   type: string
   *                   example: Booking created
   *       400:
   *         description: Missing session ID
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *       401:
   *         $ref: "#/components/responses/Unauthorized"
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async createBooking(req, res) {
    try {
      console.log("USER:", req.authenticatedUser);
      console.log("BODY:", req.body);

      if (!req.authenticatedUser) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      if (!req.body.sessionId) {
        return res.status(400).json({
          message: "sessionId is required",
        });
      }

      const booking = new BookingModel(
        null,
        req.body.sessionId,
        new Date(),
        req.authenticatedUser.id,
      );

      const result = await BookingModel.create(booking);

      return res.status(200).json({
        id: result.insertId,
        message: "Booking created",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Failed to create booking",
        errors: [error.message || error],
      });
    }
  }

  /**
   * Get bookings for logged-in user
   *
   * @openapi
   * /api/booking:
   *   get:
   *     summary: Get bookings for logged-in user
   *     tags: [Bookings]
   *     security:
   *       - ApiKey: []
   *     responses:
   *       200:
   *         description: List of bookings for the authenticated member
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/Booking"
   *       401:
   *         $ref: "#/components/responses/Unauthorized"
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async getUserBookings(req, res) {
    try {
      console.log("GET /api/booking USER:", req.user);
      console.log("GET /api/booking AUTH USER:", req.authenticatedUser);

      if (!req.authenticatedUser) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const bookings = await BookingActivityModel.getByMember(
        req.authenticatedUser.id,
      );
      console.log("Bookings:", bookings);
      console.log("BOOKINGS:", JSON.stringify(bookings, null, 2));
      console.log("FIRST BOOKING:", bookings?.[0]);
      console.log("FIRST BOOKING ID:", bookings?.[0]?.id);
      console.log("IS ARRAY:", Array.isArray(bookings));
      return res.status(200).json(bookings);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Failed to load bookings",
      });
    }
  }

  /**
   * Delete booking
   *
   * @openapi
   * /api/booking/{id}:
   *   delete:
   *     summary: Delete a booking
   *     tags: [Bookings]
   *     security:
   *       - ApiKey: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *           example: 52
   *     responses:
   *       200:
   *         description: Booking deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - message
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Booking deleted successfully
   *       400:
   *         description: Invalid booking ID
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *       401:
   *         $ref: "#/components/responses/Unauthorized"
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async deleteBooking(req, res) {
    try {
      if (!req.authenticatedUser) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const id = Number(req.params.id);

      if (Number.isNaN(id)) {
        return res.status(400).json({
          message: "Invalid booking ID",
        });
      }

      await BookingModel.delete(id);

      return res.status(200).json({
        message: "Booking deleted successfully",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Failed to delete booking",
      });
    }
  }

  /**
   * Export bookings as XML
   *
   * @openapi
   * /api/booking/xml:
   *   get:
   *     summary: Export bookings to XML
   *     tags: [Bookings]
   *     security:
   *       - ApiKey: []
   *     responses:
   *       200:
   *         description: XML export of bookings
   *         content:
   *           text/xml:
   *             schema:
   *               type: string
   *       401:
   *         $ref: "#/components/responses/Unauthorized"
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async getMemberBookingXML(req, res) {
    try {
      if (!req.authenticatedUser) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const date = DatabaseModel.toMySqlDate(new Date());

      const bookings = await BookingModel.getByUserId(req.authenticatedUser.id);

      return res
        .status(200)
        .contentType("text/xml")
        .render("xml/members.xml.ejs", {
          bookings,
          date,
        });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Failed to export bookings",
      });
    }
  }
}
