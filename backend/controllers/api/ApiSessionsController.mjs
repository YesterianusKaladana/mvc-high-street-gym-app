import express from "express";
import { ApiAuthenticationController } from "./ApiAuthenticationController.mjs";
import { SessionModel } from "../../models/SessionModel.mjs";
import { SessionActivityModel } from "../../models/SessionActivityModel.mjs";
import { ActivityModel } from "../../models/ActivityModel.mjs";
import { LocationModel } from "../../models/LocationModel.mjs";

export class ApiSessionsController {
  static routes = express.Router();

  static {
    this.routes.use(ApiAuthenticationController.middleware);
    this.routes.get(
      "/",
      ApiAuthenticationController.restrict(["trainer"]),
      this.getSessions,
    );
    this.routes.get(
      "/my",
      ApiAuthenticationController.restrict(["trainer"]),
      this.getMySessions,
    );
    this.routes.post(
      "/",
      ApiAuthenticationController.restrict(["trainer"]),
      this.createTrainerSession,
    );
    this.routes.get(
      "/:id",
      ApiAuthenticationController.restrict(["trainer"]),
      this.getTrainerSessionsById,
    );
    this.routes.put(
      "/:id",
      ApiAuthenticationController.restrict(["trainer"]),
      this.updateTrainerSessions,
    );
    this.routes.delete(
      "/:id",
      ApiAuthenticationController.restrict(["trainer"]),
      this.deleteTrainerSessions,
    );
    this.routes.get(
      "/xml",
      ApiAuthenticationController.restrict(["trainer"]),
      this.handleExportSessionsXML,
    );
  }

  /**
   * Get all sessions with full details
   *
   * @openapi
   * /api/session:
   *   get:
   *     summary: Get all sessions
   *     description: Returns all gym sessions with activity, location, trainer and capacity information.
   *     tags:
   *       - Session
   *     parameters:
   *       - in: query
   *         name: filter
   *         schema:
   *           type: string
   *         description: Optional filter to search sessions by activity name, location name, or trainer name.
   *     responses:
   *       '200':
   *         description: Successfully retrieved sessions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/Session"
   *
   *       '401':
   *         $ref: "#/components/responses/Unauthorized"
   *
   *       '403':
   *         $ref: "#/components/responses/Forbidden"
   *
   *       '500':
   *         $ref: "#/components/responses/Error"
   */
  static async getSessions(req, res) {
    try {
      const { filter } = req.query;

      const sessions = await SessionActivityModel.getAllWithDetails(filter);

      console.log("DATABASE SESSIONS:", JSON.stringify(sessions, null, 2));

      const now = new Date();

      const formattedSessions = sessions.map((item) => {
        const [hh, mm] = (item.end_time || "00:00").slice(0, 5).split(":");

        const sessionEnd = new Date(item.date);
        sessionEnd.setHours(Number(hh), Number(mm), 0, 0);

        const isExpired = sessionEnd.getTime() < now.getTime();

        return {
          session_id: item.session_id,
          activity_id: item.activity_id,
          location_id: item.location_id,
          activity_name: item.activity_name,
          location_name: item.location_name,
          trainer_name: item.trainer_name,
          date: item.date,
          start_time: item.start_time,
          end_time: item.end_time,
          capacity: item.capacity,
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

  static async getMySessions(req, res) {
    try {
      const trainerId = req.authenticatedUser.id;
      const sessions = await SessionActivityModel.getByUserId(trainerId);

      return res.status(200).json(sessions);
    } catch (error) {
      console.error("GET MY SESSIONS ERROR:", error);

      return res.status(500).json({
        message: "Failed to load your sessions.",
        error: error.message,
      });
    }
  }

  /**
   *
   * Creates a new session in the database from trainer session management page.
   */
  static async createTrainerSession(req, res) {
    try {
      if (!req.authenticatedUser) {
        return res.status(401).json({
          message: "Please log in first.",
        });
      }

      const { activity_id, location_id, date, start_time, end_time, capacity } =
        req.body;

      if (
        !activity_id ||
        !location_id ||
        !date ||
        !start_time ||
        !end_time ||
        capacity === undefined ||
        capacity === ""
      ) {
        return res.status(400).json({
          message: "Please complete all session fields.",
        });
      }

      if (
        !Number.isInteger(Number(activity_id)) ||
        !Number.isInteger(Number(location_id))
      ) {
        return res.status(400).json({
          message: "Please select a valid activity and location.",
        });
      }

      if (!Number.isInteger(Number(capacity)) || Number(capacity) < 1) {
        return res.status(400).json({
          message: "Capacity must be a positive whole number.",
        });
      }

      if (end_time <= start_time) {
        return res.status(400).json({
          message: "End time must be after start time.",
        });
      }

      if (new Date(`${date}T${start_time}`) <= new Date()) {
        return res.status(400).json({
          message: "The session must start in the future.",
        });
      }

      const activity = await ActivityModel.getById(Number(activity_id));
      const location = await LocationModel.getById(Number(location_id));

      if (!activity || !location) {
        return res.status(400).json({
          message: "The selected activity or location does not exist.",
        });
      }

      const newSession = await SessionModel.create({
        user_id: req.authenticatedUser.id,
        activity_id: Number(activity_id),
        location_id: Number(location_id),
        date,
        start_time,
        end_time,
        capacity: Number(capacity),
      });

      return res.status(201).json({
        message: "Session created successfully.",
        session: newSession,
      });
    } catch (error) {
      console.error("SESSION CREATE ERROR:", error);
      return res.status(500).json({
        message: "Failed to create session.",
        error: error.message,
      });
    }
  }

  /**
   * @openapi
   * /api/session/xml:
   *   get:
   *     summary: Export session in XML format
   *     description: Exports a specific active gym session in XML 1.0 format.
   *     tags:
   *       - XML
   *     security:
   *       - ApiKey: []
   *     responses:
   *       '200':
   *         description: Successfully exported session in XML format
   *         content:
   *           application/xml:
   *             schema:
   *               type: string
   *             example: |
   *               <?xml version="1.0" encoding="UTF-8"?>
   *               <sessions>
   *                 <session>
   *                   <session_id>1</session_id>
   *                   <trainer_name>Yesterianus</trainer_name>
   *                   <location_name>Westlake</location_name>
   *                   <activity_name>Yoga</activity_name>
   *                   <date>2026-06-06</date>
   *                   <start_time>09:58</start_time>
   *                   <end_time>11:58</end_time>
   *                   <capacity>3</capacity>
   *                 </session>
   *               </sessions>
   *       '401':
   *         $ref: "#/components/responses/Unauthorized"
   *       '403':
   *         $ref: "#/components/responses/Forbidden"
   *       '500':
   *         $ref: "#/components/responses/Error"
   */
  static async handleExportSessionsXML(req, res) {
    try {
      const exportDate = new Date().toISOString().slice(0, 10);

      const sessions = await SessionActivityModel.getAllWithDetails();

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sessions export-date="${exportDate}">\n`;

      sessions.forEach((s) => {
        xml += `
          <session>
            <session_id>${s.session_id}</session_id>
            <activity_name>${s.activity_name}</activity_name>
            <location_name>${s.location_name}</location_name>
            <trainer_name>${s.trainer_name}</trainer_name>
            <date>${String(s.date).slice(0, 10)}</date>
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
        message: "Failed to generate XML sessions",
      });
    }
  }

  static async getTrainerSessionsById(req, res) {
    try {
      const { id } = req.params;

      if (!Number.isInteger(Number(id)) || Number(id) < 1) {
        return res.status(400).json({
          message: "Invalid trainer ID.",
        });
      }

      if (Number(id) !== Number(req.authenticatedUser.id)) {
        return res.status(403).json({
          message: "You can only view your own sessions.",
        });
      }

      const sessions = await SessionActivityModel.getByUserId(Number(id));

      return res.status(200).json(sessions);
    } catch (error) {
      console.error("GET TRAINER SESSIONS ERROR:", error);

      return res.status(500).json({
        message: "Failed to load trainer sessions.",
        error: error.message,
      });
    }
  }

  static async updateTrainerSessions(req, res) {
    try {
      const id = Number(req.params.id);
      const { activity_id, location_id, date, start_time, end_time, capacity } =
        req.body;

      if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({
          message: "Invalid session ID.",
        });
      }

      const existingSession = await SessionModel.getById(id);

      if (!existingSession) {
        return res.status(404).json({
          message: "Session not found.",
        });
      }

      if (
        Number(existingSession.user_id) !== Number(req.authenticatedUser.id)
      ) {
        return res.status(403).json({
          message: "You can only edit your own sessions.",
        });
      }

      if (
        !activity_id ||
        !location_id ||
        !date ||
        !start_time ||
        !end_time ||
        capacity === undefined ||
        capacity === ""
      ) {
        return res.status(400).json({
          message: "Please complete all session fields.",
        });
      }

      if (
        !Number.isInteger(Number(activity_id)) ||
        !Number.isInteger(Number(location_id))
      ) {
        return res.status(400).json({
          message: "Please select a valid activity and location.",
        });
      }

      if (!Number.isInteger(Number(capacity)) || Number(capacity) < 1) {
        return res.status(400).json({
          message: "Capacity must be a positive whole number.",
        });
      }

      if (end_time <= start_time) {
        return res.status(400).json({
          message: "End time must be after start time.",
        });
      }

      if (new Date(`${date}T${start_time}`) <= new Date()) {
        return res.status(400).json({
          message: "The session must start in the future.",
        });
      }

      const activity = await ActivityModel.getById(Number(activity_id));
      const location = await LocationModel.getById(Number(location_id));

      if (!activity || !location) {
        return res.status(400).json({
          message: "The selected activity or location does not exist.",
        });
      }

      await SessionModel.update({
        id,
        user_id: existingSession.user_id,
        activity_id: Number(activity_id),
        location_id: Number(location_id),
        date,
        start_time,
        end_time,
        capacity: Number(capacity),
      });

      return res.status(200).json({
        message: "Session updated successfully.",
      });
    } catch (error) {
      console.error("SESSION UPDATE ERROR:", error);

      return res.status(500).json({
        message: "Failed to update session.",
        error: error.message,
      });
    }
  }

  static async deleteTrainerSessions(req, res) {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({
          message: "Invalid session ID.",
        });
      }

      const session = await SessionModel.getById(id);

      if (!session) {
        return res.status(404).json({
          message: "Session not found.",
        });
      }

      if (Number(session.user_id) !== Number(req.authenticatedUser.id)) {
        return res.status(403).json({
          message: "You can only delete your own sessions.",
        });
      }

      await SessionModel.delete(id);

      return res.status(200).json({
        message: "Session deleted successfully.",
      });
    } catch (error) {
      console.error("SESSION DELETE ERROR:", error);

      return res.status(500).json({
        message: "Failed to delete session.",
        error: error.message,
      });
    }
  }
}
