import express from "express";
import { BookingModel } from "../../models/BookingModel.mjs";
import { DatabaseModel } from "../../models/DatabaseModel.mjs";

export class ApiBookingsController {
  static routes = express.Router();

  static {
    this.routes.post("/", this.createBooking);
    this.routes.get("/", this.getBookingUserInfoById);
    this.routes.get("/xml", this.getMemberBookingXML);
    this.routes.delete("/:id", this.deleteBooking);
  }

  /**
   * Handle creating a new Booking
   *
   * @type {express.RequestHandler}
   *
   * @openapi
   * /api/bookings:
   *   post:
   *     summary: Create a new Booking
   *     tags: [Bookings]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/Bookings"
   *     responses:
   *       '200':
   *         $ref: "#/components/responses/Created"
   *       default:
   *         $ref: "#/components/responses/Error"
   */
  static async createBooking(req, res) {
    try {
      const booking = new BookingModel(
        null,
        req.body.sessionId,
        new Date(),
        req.userId,
      );

      const result = await BookingModel.create(booking);

      res.status(200).json({
        id: result.insertId,
        message: "Booking created",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to create booking",
        errors: [error],
      });
    }
  }

  static async getBookingUserInfoById(req, res) {
    return res.status(501).json({
      message: "Not implemented",
    });
  }

  static async deleteBooking(req, res) {
    return res.status(501).json({
      message: "Not implemented",
    });
  }

  /**
   * Handle exporting all completed bookings to XML
   *
   * @type {express.RequestHandler}
   *
   * @openapi
   * /api/bookings/xml:
   *   get:
   *     summary: Export all completed bookings to XML
   *     tags: [Bookings]
   *     security:
   *       - ApiKey: []
   *     responses:
   *       '200':
   *         description: Complete bookings XML
   *         content:
   *           text/xml:
   *             schema:
   *               type: array
   *               xml:
   *                 name: bookings
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                     example: "1"
   *                   session_id:
   *                     type: string
   *                     example: "2"
   *                   created:
   *                     type: string
   *                     example: "2026-06-10"
   *                   user_id:
   *                     type: string
   *                     example: "3"
   *       default:
   *         $ref: "#/components/responses/Error"
   */
  static async getMemberBookingXML(req, res) {
    try {
      const date = DatabaseModel.toMySqlDate(new Date());

      // FIX: user was undefined
      const userId = req.userId;

      const bookings = await BookingModel.getByUser(userId);

      res.status(200).contentType("text/xml").render("xml/members.xml.ejs", {
        bookings,
        date,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to export bookings as XML from database",
        errors: [error],
      });
    }
  }
}
