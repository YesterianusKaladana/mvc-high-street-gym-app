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

    // Testing purpose routes
    this.routes.get("/debug/db", async (req, res) => {
      const rows = await SessionModel.getAll();
      console.log("DB RAW:", rows);
      res.json(rows);
    });
  }

  /**
   * @openapi
   * /api/sessions:
   *   get:
   *     summary: Get all sessions with full details
   *     tags: [Sessions]
   *     responses:
   *       200:
   *         description: List of sessions with activity, location and trainer
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/SessionActivity"
   *       500:
   *         description: Server error
   */
  static async getSessions(req, res) {
    try {
      const sessions = await SessionActivityModel.getAll();

      console.log("SESSION COUNT:", sessions.length);

      return res.status(200).json(sessions);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * @type {express.RequestHandler}
   * @openapi
   * /api/sessions/xml:
   *    get:
   *        summary: "Get all sessions in XML format"
   *        tags: [Sessions]
   *        description: Returns all session records formatted as XML instead of JSON.
   *        responses:
   *            '200':
   *                description: "XML session list"
   *                content:
   *                    application/xml:
   *                        schema:
   *                            type: string
   *                            example: |
   *                              <?xml version="1.0"?>
   *                              <sessions>
   *                                <session>
   *                                  <id>1</id>
   *                                  <user_id>2</user_id>
   *                                </session>
   *                              </sessions>
   *            '500':
   *                $ref: "#/components/responses/Error"
   */
  static async getSessionsXML(req, res) {
    try {
      const sessions = await SessionModel.getAll();

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sessions>\n`;

      sessions.forEach((s) => {
        xml += `
    <session>
      <id>${s.id}</id>
      <user_id>${s.user_id}</user_id>
      <location_id>${s.location_id}</location_id>
      <activity_id>${s.activity_id}</activity_id>
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

  /**
   * @type {express.RequestHandler}
   * @openapi
   * /api/sessions/trainer/{id}:
   *    get:
   *        summary: "Get sessions by trainer ID"
   *        tags: [Sessions]
   *        description: Returns all sessions created by a specific trainer.
   *        parameters:
   *          - name: id
   *            in: path
   *            required: true
   *            description: Trainer user ID
   *            schema:
   *              type: integer
   *              example: 1
   *        responses:
   *            '200':
   *                description: "Trainer session list"
   *                content:
   *                    application/json:
   *                        schema:
   *                            type: array
   *                            items:
   *                                $ref: "#/components/schemas/Session"
   *            '500':
   *                $ref: "#/components/responses/Error"
   */
  static async getTrainerSessionsById(req, res) {
    try {
      const { id } = req.params;
      const sessions = await SessionActivityModel.getByUserId(id);
      return res.status(200).json(sessions);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to load trainer sessions",
      });
    }
  }

  /**
   * @type {express.RequestHandler}
   * @openapi
   * /api/sessions/{id}:
   *    delete:
   *        summary: "Delete a session by ID"
   *        tags: [Sessions]
   *        description: Soft deletes a session.
   *        parameters:
   *          - name: id
   *            in: path
   *            required: true
   *            description: Session ID to delete
   *            schema:
   *              type: integer
   *              example: 10
   *        responses:
   *            '200':
   *                description: "Session deleted successfully"
   *                content:
   *                    application/json:
   *                        schema:
   *                            type: object
   *                            properties:
   *                                message:
   *                                    type: string
   *                                    example: Session deleted successfully
   *            '500':
   *                $ref: "#/components/responses/Error"
   */
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
