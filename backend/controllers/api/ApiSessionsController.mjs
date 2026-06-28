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
   * Get all sessions with details
   * @openapi
   * /api/session:
   *   get:
   *     summary: "Get all sessions"
   *     tags: [Session]
   *     responses:
   *       200:
   *         description: List of sessions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/Session"
   *
   *       500:
   *         description: Failed to load sessions from database
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Failed to load sessions from database"
   */
  static async getSessions(req, res) {
    try {
      const sessions = await SessionActivityModel.getAll();

      return res.status(200).json(sessions);
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
