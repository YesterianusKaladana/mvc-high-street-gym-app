import express from "express";
import { ApiAuthenticationController } from "./ApiAuthenticationController.mjs";
import { SessionModel } from "../../models/SessionModel.mjs";
import { SessionActivityModel } from "../../models/SessionActivityModel.mjs";

export class ApiSessionsController {
  static routes = express.Router();

  static {
    this.routes.use(ApiAuthenticationController.middleware);
    this.routes.get("/", this.getSessions);
    this.routes.get("/xml", this.getSessionsXML);
    this.routes.get("/trainer/:id", this.getTrainerSessionsById);
    this.routes.delete("/:id", this.deleteTrainerSessions);
  }

  /**
   * Get all sessions with full details (public API)
   *
   * @openapi
   * /api/session:
   *   get:
   *     summary: Get all sessions
   *     description: Returns all gym sessions with activity, location, trainer, and computed expiry status.
   *     tags:
   *       - Session
   *     responses:
   *       200:
   *         description: Successfully retrieved sessions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   session_id:
   *                     type: integer
   *                     example: 1
   *                   activity_name:
   *                     type: string
   *                     example: Yoga
   *                   location_name:
   *                     type: string
   *                     example: Studio A
   *                   trainer_name:
   *                     type: string
   *                     example: John Smith
   *                   date:
   *                     type: string
   *                     format: date
   *                     example: "2026-07-20"
   *                   weekday:
   *                     type: string
   *                     example: Monday
   *                   start_time:
   *                     type: string
   *                     example: "09:00"
   *                   end_time:
   *                     type: string
   *                     example: "10:00"
   *                   capacity:
   *                     type: integer
   *                     example: 20
   *                   isExpired:
   *                     type: boolean
   *                     example: false
   *       500:
   *         description: Failed to load sessions from database
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Failed to load sessions from database
   *                 error:
   *                   type: string
   *                   example: Database connection failed
   */
  static async getSessions(req, res) {
    try {
      const sessions = await SessionActivityModel.getAllWithDetails();

      console.log("DATABASE SESSIONS:", sessions);

      const now = new Date();

      const formattedSessions = sessions.map((item) => {
        const [hh, mm] = (item.end_time || "00:00").slice(0, 5).split(":");

        const sessionEnd = new Date(item.date);
        sessionEnd.setHours(Number(hh), Number(mm), 0, 0);

        const isExpired = sessionEnd.getTime() < now.getTime();

        const weekday = new Date(item.date).toLocaleDateString("en-AU", {
          weekday: "long",
        });

        return {
          session_id: item.session_id,
          activity_name: item.activity_name,
          location_name: item.location_name,
          trainer_name: item.trainer_name,
          date: item.date,
          weekday,
          start_time: item.start_time,
          end_time: item.end_time,
          capacity: item.capacity,
          isExpired,
        };
      });

      return res.status(200).json(formattedSessions);
    } catch (err) {
      console.error("SESSION ERROR:", err);

      return res.status(500).json({
        message: "Failed to load sessions from database",
        error: err.message,
      });
    }
  }

  static async getSessionsXML(req, res) {
    try {
      const sessions = await SessionActivityModel.getAllWithDetails();

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sessions>\n`;

      sessions.forEach((s) => {
        xml += `
          <session>
            <session_id>${s.session_id}</session_id>
            <activity_name>${s.activity_name}</activity_name>
            <location_name>${s.location_name}</location_name>
            <trainer_name>${s.trainer_name}</trainer_name>
            <date>${s.date}</date>
            <start_time>${s.start_time}</start_time>
            <end_time>${s.end_time}</end_time>
            <capacity>${s.capacity}</capacity>
          </session>`;
      });

      xml += `\n</sessions>`;

      res.setHeader("Content-Type", "application/xml");
      return res.status(200).send(xml);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to generate XML",
      });
    }
  }

  static async getTrainerSessionsById(req, res) {
    try {
      const { id } = req.params;

      const sessions = await SessionActivityModel.getByUserId(id);

      return res.status(200).json(sessions);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to load trainer sessions",
      });
    }
  }

  static async deleteTrainerSessions(req, res) {
    try {
      const { id } = req.params;
      await SessionModel.delete(id);
      return res.status(200).json({
        message: "Session deleted successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to delete sessions",
      });
    }
  }
}
