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

    this.routes.get("/", this.getSessions);

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

    // Register specific routes before /:id.
    this.routes.get(
      "/xml",
      ApiAuthenticationController.restrict(["trainer"]),
      this.handleExportSessionsXML,
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
  }

  /**
   * @openapi
   * /api/session:
   *   get:
   *     summary: Get all sessions
   *     description: Returns gym sessions with activity, location, trainer and capacity information.
   *     tags:
   *       - Session
   *     parameters:
   *       - in: query
   *         name: filter
   *         schema:
   *           type: string
   *         description: Optional session search filter.
   *     responses:
   *       '200':
   *         description: Successfully retrieved sessions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/Session"
   *       '401':
   *         $ref: "#/components/responses/Unauthorized"
   *       '403':
   *         $ref: "#/components/responses/Forbidden"
   *       '500':
   *         $ref: "#/components/responses/Error"
   */
  static async getSessions(req, res) {
    try {
      const { filter } = req.query;
      const sessions = await SessionActivityModel.getAllWithDetails(filter);

      const formattedSessions = sessions.map((item) => ({
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
      }));

      return res.status(200).json(formattedSessions);
    } catch (error) {
      console.error("GET SESSIONS ERROR:", error);

      return res.status(500).json({
        message: "Failed to load sessions from database.",
        error: error.message,
      });
    }
  }

  /**
   * @openapi
   * /api/session/my:
   *   get:
   *     summary: Get my sessions
   *     description: Returns sessions belonging to the authenticated trainer.
   *     tags:
   *       - Session
   *     responses:
   *       '200':
   *         description: Successfully retrieved trainer sessions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/Session"
   *       '401':
   *         $ref: "#/components/responses/Unauthorized"
   *       '403':
   *         $ref: "#/components/responses/Forbidden"
   *       '500':
   *         $ref: "#/components/responses/Error"
   */
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
   * @openapi
   * /api/session:
   *   post:
   *     summary: Create a trainer session
   *     description: Creates a new gym session for the authenticated trainer.
   *     tags:
   *       - Session
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - activity_id
   *               - location_id
   *               - date
   *               - start_time
   *               - end_time
   *               - capacity
   *             properties:
   *               activity_id:
   *                 type: integer
   *               location_id:
   *                 type: integer
   *               date:
   *                 type: string
   *                 format: date
   *               start_time:
   *                 type: string
   *               end_time:
   *                 type: string
   *               capacity:
   *                 type: integer
   *                 minimum: 1
   *     responses:
   *       '201':
   *         description: Session created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - message
   *                 - session
   *               properties:
   *                 message:
   *                   type: string
   *                 session:
   *                   type: object
   *                   description: Newly created session returned by the session model
   *                   additionalProperties: true
   *       '400':
   *         description: Invalid session details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - message
   *               properties:
   *                 message:
   *                   type: string
   *       '401':
   *         description: Authentication required
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - message
   *               properties:
   *                 message:
   *                   type: string
   *       '403':
   *         $ref: "#/components/responses/Forbidden"
   *       '500':
   *         description: Failed to create session
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - message
   *                 - error
   *               properties:
   *                 message:
   *                   type: string
   *                 error:
   *                   type: string
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

      const sessionDateTime = new Date(`${date}T${start_time}`);

      if (
        Number.isNaN(sessionDateTime.getTime()) ||
        sessionDateTime <= new Date()
      ) {
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
   *     summary: Export sessions as XML
   *     description: Exports gym sessions in XML format.
   *     tags:
   *       - XML
   *     security:
   *       - ApiKey: []
   *     responses:
   *       '200':
   *         description: Successfully exported sessions
   *         content:
   *           application/xml:
   *             schema:
   *               type: string
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

      sessions.forEach((session) => {
        xml += `  <session>
    <session_id>${session.session_id}</session_id>
    <activity_name>${session.activity_name}</activity_name>
    <location_name>${session.location_name}</location_name>
    <trainer_name>${session.trainer_name}</trainer_name>
    <date>${String(session.date).slice(0, 10)}</date>
    <start_time>${session.start_time}</start_time>
    <end_time>${session.end_time}</end_time>
    <capacity>${session.capacity}</capacity>
  </session>\n`;
      });

      xml += "</sessions>";

      res.setHeader("Content-Type", "application/xml; charset=UTF-8");
      return res.status(200).send(xml);
    } catch (error) {
      console.error("EXPORT SESSIONS XML ERROR:", error);

      return res.status(500).json({
        message: "Failed to generate XML sessions.",
      });
    }
  }

  /**
   * @openapi
   * /api/session/{id}:
   *   get:
   *     summary: Get sessions for a trainer
   *     description: Returns sessions belonging to the specified authenticated trainer.
   *     tags:
   *       - Session
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Trainer user ID
   *     responses:
   *       '200':
   *         description: Successfully retrieved trainer sessions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/Session"
   *       '400':
   *         $ref: "#/components/responses/BadRequest"
   *       '401':
   *         $ref: "#/components/responses/Unauthorized"
   *       '403':
   *         $ref: "#/components/responses/Forbidden"
   *       '500':
   *         $ref: "#/components/responses/Error"
   */
  static async getTrainerSessionsById(req, res) {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({
          message: "Invalid trainer ID.",
        });
      }

      if (id !== Number(req.authenticatedUser.id)) {
        return res.status(403).json({
          message: "You can only view your own sessions.",
        });
      }

      const sessions = await SessionActivityModel.getByUserId(id);

      return res.status(200).json(sessions);
    } catch (error) {
      console.error("GET TRAINER SESSIONS ERROR:", error);

      return res.status(500).json({
        message: "Failed to load trainer sessions.",
        error: error.message,
      });
    }
  }

  /**
   * @openapi
   * /api/session/{id}:
   *   put:
   *     summary: Update a trainer session
   *     description: Updates a session owned by the authenticated trainer.
   *     tags:
   *       - Session
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Session ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - activity_id
   *               - location_id
   *               - date
   *               - start_time
   *               - end_time
   *               - capacity
   *             properties:
   *               activity_id:
   *                 type: integer
   *               location_id:
   *                 type: integer
   *               date:
   *                 type: string
   *                 format: date
   *               start_time:
   *                 type: string
   *               end_time:
   *                 type: string
   *               capacity:
   *                 type: integer
   *                 minimum: 1
   *     responses:
   *       '200':
   *         description: Session updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - message
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Session updated successfully.
   *       '400':
   *         description: Invalid session details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - message
   *               properties:
   *                 message:
   *                   type: string
   *       '401':
   *         $ref: "#/components/responses/Unauthorized"
   *       '403':
   *         $ref: "#/components/responses/Forbidden"
   *       '404':
   *         $ref: "#/components/responses/NotFound"
   *       '500':
   *         description: Failed to update session
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - message
   *                 - error
   *               properties:
   *                 message:
   *                   type: string
   *                 error:
   *                   type: string
   */
  static async updateTrainerSessions(req, res) {
    try {
      const id = Number(req.params.id);

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

      const sessionDateTime = new Date(`${date}T${start_time}`);

      if (
        Number.isNaN(sessionDateTime.getTime()) ||
        sessionDateTime <= new Date()
      ) {
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

  /**
   * @openapi
   * /api/session/{id}:
   *   delete:
   *     summary: Delete a trainer session
   *     description: Deletes a session owned by the authenticated trainer.
   *     tags:
   *       - Session
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Session ID
   *     responses:
   *       '200':
   *         description: Session deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - message
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Session deleted successfully.
   *       '400':
   *         description: Invalid session ID
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - message
   *               properties:
   *                 message:
   *                   type: string
   *       '401':
   *         $ref: "#/components/responses/Unauthorized"
   *       '403':
   *         $ref: "#/components/responses/Forbidden"
   *       '404':
   *         $ref: "#/components/responses/NotFound"
   *       '500':
   *         description: Failed to delete session
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - message
   *                 - error
   *               properties:
   *                 message:
   *                   type: string
   *                 error:
   *                   type: string
   */
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
