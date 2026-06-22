import express from "express";
import { BookingModel } from "../../models/BookingModel.mjs";
import { DatabaseModel } from "../../models/DatabaseModel.mjs";

export class ApiBookingsController {
  static routes = express.Router();

  static {
    this.routes.post("/", this.createBooking);
    this.routes.get("/", this.getUserBookings);
    this.routes.get("/xml", this.getMemberBookingXML);
    this.routes.delete("/:id", this.deleteBooking);
  }

  /**
   * Create a new booking
   * @type {express.RequestHandler}
   * @openapi
   * /api/bookings:
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
   *                 example: 2
   *     responses:
   *       200:
   *         description: Booking created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 message:
   *                   type: string
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async createBooking(req, res) {
    try {
      const booking = new BookingModel(
        null,
        req.body.sessionId,
        new Date(),
        req.user.id,
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
   * @type {express.RequestHandler}
   * @openapi
   * /api/bookings:
   *   get:
   *     summary: Get bookings for logged-in user
   *     tags: [Bookings]
   *     security:
   *       - ApiKey: []
   *     responses:
   *       200:
   *         description: List of bookings
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/Booking"
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async getUserBookings(req, res) {
    try {
      const bookings = await BookingModel.getByUserId(req.user.id);

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
   * @type {express.RequestHandler}
   * @openapi
   * /api/bookings/{id}:
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
   *           example: 5
   *     responses:
   *       200:
   *         description: Booking deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       400:
   *         description: Invalid booking ID
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async deleteBooking(req, res) {
    try {
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
   * @type {express.RequestHandler}
   * @openapi
   * /api/bookings/xml:
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
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async getMemberBookingXML(req, res) {
    try {
      const date = DatabaseModel.toMySqlDate(new Date());

      const bookings = await BookingModel.getByUserId(req.user.id);

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
