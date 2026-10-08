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

    this.routes.get("/", this.getBookings);

    this.routes.get("/xml", this.handleExportBookingsXML);

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

      const sessionId = Number(req.body.sessionId);
      const userId = req.authenticatedUser.id;

      // Check if the user has already booked this session
      const existingBooking = await BookingModel.find(userId, sessionId);

      if (existingBooking) {
        return res.status(400).json({
          message:
            "You have already booked this session. No duplicate bookings are allowed.",
        });
      }

      const booking = new BookingModel(null, sessionId, new Date(), userId);

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
  static async getBookings(req, res) {
    try {
      if (!req.authenticatedUser) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const bookings = await BookingActivityModel.getByMember(
        req.authenticatedUser.id,
      );
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
   * @openapi
   * /api/booking/xml:
   *   get:
   *     summary: Export member bookings in XML format
   *     description: Exports the authenticated member's bookings in XML 1.0 format.
   *     tags:
   *       - XML
   *     security:
   *       - ApiKey: []
   *     responses:
   *       '200':
   *         description: Successfully exported member bookings in XML format
   *         content:
   *           application/xml:
   *             schema:
   *               type: string
   *             example: |
   *               <?xml version="1.0" encoding="UTF-8"?>
   *               <!DOCTYPE bookings [
   *                 <!ELEMENT bookings (booking*)>
   *                 <!ATTLIST bookings export-date CDATA "0000-00-00">
   *                 <!ELEMENT booking (id, activity, location, date, start_time, end_time, trainer)>
   *                 <!ELEMENT id (#PCDATA)>
   *                 <!ELEMENT activity (#PCDATA)>
   *                 <!ELEMENT location (#PCDATA)>
   *                 <!ELEMENT date (#PCDATA)>
   *                 <!ELEMENT start_time (#PCDATA)>
   *                 <!ELEMENT end_time (#PCDATA)>
   *                 <!ELEMENT trainer (#PCDATA)>
   *               ]>
   *               <bookings export-date="2026-10-02">
   *                 <booking>
   *                   <id>52</id>
   *                   <activity>Yoga</activity>
   *                   <location>Westlake</location>
   *                   <date>2026-06-06</date>
   *                   <start_time>09:58</start_time>
   *                   <end_time>11:58</end_time>
   *                   <trainer>Yesterianus Kaladana</trainer>
   *                 </booking>
   *               </bookings>
   *       '401':
   *         $ref: "#/components/responses/Unauthorized"
   *       '403':
   *         $ref: "#/components/responses/Forbidden"
   *       '500':
   *         $ref: "#/components/responses/Error"
   */
  static async handleExportBookingsXML(req, res) {
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
