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
   * @type {express.RequestHandler}
   * @openapi
   * /api/sessions:
   *    get:
   *        summary: "Get the list of all sessions"
   *        tags: [Sessions]
   *        parameters:
   *          - name: filter
   *            in: query
   *            description: Search filter on session names and activities
   *            required: false
   *            schema:
   *                type: string
   *                example: boxing
   *        responses:
   *            '200':
   *                description: "Session list"
   *                content:
   *                    application/json:
   *                        schema:
   *                            type: array
   *                            items:
   *                                $ref: "#/components/schemas/Session"
   *            '500':
   *                $ref: "#/components/responses/Error"
   *
   */
  static async getSessions(req, res) {
   try{
    const sessions = req.query.filter
    ? await SessionActivityModel.getByUserId(req.query.filter)
    : await SessionModel.getAll();

    console.log(sessions);
    res.status(200).json(sessions);

   } catch(error){
    console.error(error);
    res.status(500).json({
      message: "Failed to load sessions from database",
    });
   }
  }

  static async getSessionsXML(req, res) {
    res.status(501).json({
      message: "Not implemented",
    });
  }

  static async getTrainerSessionsById(req, res) {
    return res.status(501).json({
      message: "Not implemented",
    });
  }

  static async deleteTrainerSessions(req, res) {
    return res.status(501).json({
      message: "Not implemented",
    });
  }
}
