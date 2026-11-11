import express from "express";
import { ApiAuthenticationController } from "./ApiAuthenticationController.mjs";
import { SessionModel } from "../../models/SessionModel.mjs";
import { SessionActivityModel } from "../../models/SessionActivityModel.mjs";

export class ApiSessionsController {
  static routes = express.Router();

  static {
    this.routes.get("/", this.getAllSessions);

    this.routes.get(
      "/xml",
      ApiAuthenticationController.restrict(["trainer"]),
      this.handleExportSessionsXML,
    );

    this.routes.get(
      "/xml/download",
      ApiAuthenticationController.restrict(["trainer"]),
      this.handleDownloadSessionsXML,
    );

    this.routes.delete(
      "/:id",
      ApiAuthenticationController.restrict(["trainer"]),
      this.cancelSession,
    );

    this.routes.get("/:id", this.getAllSessionsById);
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
  static async getAllSessions(req, res) {
    try {
      // Retrieve the optional filter query parameter
      const { filter } = req.query;
      const sessions = await SessionActivityModel.getAllWithDetails(filter);

      // Format the sessions to match the expected response structure
      const formattedSessions = sessions.map((item) => ({
        session_id: item.session_id,
        session_user_id: item.session_user_id,
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
      console.error(error);
      return res.status(500).json({
        message: "Failed to load sessions from database.",
      });
    }
  }

  /**
   * @openapi
   * /api/session/{id}:
   *   get:
   *     summary: Get a session by ID
   *     description: Returns a specific gym session by its ID.
   *     tags:
   *       - Session
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: integer
   *         required: true
   *         description: The ID of the session to retrieve.
   *     responses:
   *       '200':
   *         description: Successfully retrieved the session
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Session"
   *       '400':
   *         $ref: "#/components/responses/BadRequest"
   *       '401':
   *         description: Authentication required or invalid authentication key.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *               required:
   *                 - message
   *       '404':
   *         $ref: "#/components/responses/NotFound"
   *       '500':
   *         $ref: "#/components/responses/Error"
   */
  static async getAllSessionsById(req, res) {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({
          message: "Invalid session ID.",
        });
      }

      const session = await SessionActivityModel.getById(id);

      if (!session) {
        return res.status(404).json({
          message: "Session not found.",
        });
      }

      return res.status(200).json(session);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to load session from database.",
      });
    }
  }

  /**
   * @openapi
   * /api/session/xml:
   *   get:
   *     summary: Preview trainer sessions as XML 1.0 with DTD
   *     description: >
   *       Displays sessions belonging to the authenticated trainer as an XML 1.0
   *       document including the sessions information.
   *     tags:
   *       - XML
   *     security:
   *       - ApiKey: []
   *     responses:
   *       '200':
   *         description: Successfully generated trainer sessions XML document.
   *         content:
   *           text/plain:
   *             schema:
   *               type: string
   *               example: |
   *                 <?xml version="1.0" encoding="UTF-8"?>
   *                 <!DOCTYPE sessions [
   *                     <!ELEMENT sessions (copyright, session*)>
   *                     <!ATTLIST sessions export-date CDATA #IMPLIED>
   *                     <!ELEMENT copyright (#PCDATA)>
   *                     <!ELEMENT session (session_id, activity_name, location_name, trainer_name, date, start_time, end_time, capacity)>
   *                     <!ELEMENT session_id (#PCDATA)>
   *                     <!ELEMENT activity_name (#PCDATA)>
   *                     <!ELEMENT location_name (#PCDATA)>
   *                     <!ELEMENT trainer_name (#PCDATA)>
   *                     <!ELEMENT date (#PCDATA)>
   *                     <!ELEMENT start_time (#PCDATA)>
   *                     <!ELEMENT end_time (#PCDATA)>
   *                     <!ELEMENT capacity (#PCDATA)>
   *                 ]>
   *                 <sessions export-date="2026-11-07">
   *                     <copyright>© 2026 HSG. All rights reserved.</copyright>
   *                     <session>
   *                         <session_id>1</session_id>
   *                         <activity_name>Yoga</activity_name>
   *                         <location_name>Studio 1</location_name>
   *                         <trainer_name>Yesterianus Kaladana</trainer_name>
   *                         <date>2026-11-10</date>
   *                         <start_time>09:00</start_time>
   *                         <end_time>10:00</end_time>
   *                         <capacity>20</capacity>
   *                     </session>
   *                 </sessions>
   *       '401':
   *         $ref: "#/components/responses/Unauthorized"
   *       '403':
   *         $ref: "#/components/responses/Forbidden"
   *       '500':
   *         $ref: "#/components/responses/Error"
   */
  static async handleExportSessionsXML(req, res) {
    try {
      // Get the current export date and year
      const exportDate = new Date().toISOString().slice(0, 10);
      const year = new Date().getFullYear();

      // Get the authenticated trainer's ID
      const trainerId = Number(req.authenticatedUser.id);

      // Retrieve only sessions belonging to this trainer
      const trainerSessions = await SessionActivityModel.getByUserId(trainerId);

      return res
        .status(200)
        .contentType("text/xml")
        .set("Content-Disposition", `inline; filename="my-sessions.xml"`)
        .render("xml/my-sessions.xml.ejs", {
          trainerSessions,
          exportDate,
          year,
        });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to generate XML sessions from database.",
      });
    }
  }

  /**
   * @openapi
   * /api/session/xml/download:
   *   get:
   *     summary: Download trainer sessions as XML 1.0 with DTD
   *     description: >
   *       Downloads sessions belonging to the authenticated trainer as an XML 1.0
   *       file.
   *     tags:
   *       - XML
   *     security:
   *       - ApiKey: []
   *     responses:
   *       '200':
   *         description: Successfully downloaded trainer sessions XML document.
   *         headers:
   *           Content-Disposition:
   *             description: Specifies the XML file download filename.
   *             schema:
   *               type: string
   *               example: attachment; filename="my-sessions.xml"
   *         content:
   *           text/plain:
   *             schema:
   *               type: string
   *               example: |
   *                 <?xml version="1.0" encoding="UTF-8"?>
   *                 <!DOCTYPE sessions [
   *                     <!ELEMENT sessions (copyright, session*)>
   *                     <!ATTLIST sessions export-date CDATA #IMPLIED>
   *                     <!ELEMENT copyright (#PCDATA)>
   *                     <!ELEMENT session (session_id, activity_name, location_name, trainer_name, date, start_time, end_time, capacity)>
   *                     <!ELEMENT session_id (#PCDATA)>
   *                     <!ELEMENT activity_name (#PCDATA)>
   *                     <!ELEMENT location_name (#PCDATA)>
   *                     <!ELEMENT trainer_name (#PCDATA)>
   *                     <!ELEMENT date (#PCDATA)>
   *                     <!ELEMENT start_time (#PCDATA)>
   *                     <!ELEMENT end_time (#PCDATA)>
   *                     <!ELEMENT capacity (#PCDATA)>
   *                 ]>
   *                 <sessions export-date="2026-11-07">
   *                     <copyright>© 2026 HSG. All rights reserved.</copyright>
   *                     <session>
   *                         <session_id>1</session_id>
   *                         <activity_name>Yoga</activity_name>
   *                         <location_name>Studio 1</location_name>
   *                         <trainer_name>Yesterianus Kaladana</trainer_name>
   *                         <date>2026-11-10</date>
   *                         <start_time>09:00</start_time>
   *                         <end_time>10:00</end_time>
   *                         <capacity>20</capacity>
   *                     </session>
   *                 </sessions>
   *       '401':
   *         $ref: "#/components/responses/Unauthorized"
   *       '403':
   *         $ref: "#/components/responses/Forbidden"
   *       '500':
   *         $ref: "#/components/responses/Error"
   */
  static async handleDownloadSessionsXML(req, res) {
    try {
      const exportDate = new Date().toISOString().slice(0, 10);
      const year = new Date().getFullYear();
      const trainerId = Number(req.authenticatedUser.id);

      const trainerSessions = await SessionActivityModel.getByUserId(trainerId);

      return res
        .status(200)
        .contentType("application/xml")
        .set("Content-Disposition", 'attachment; filename="my-sessions.xml"')
        .render("xml/my-sessions.xml.ejs", {
          trainerSessions,
          exportDate,
          year,
        });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to generate XML sessions from database.",
      });
    }
  }

  /**
   * @openapi
   * /api/session/{id}:
   *   delete:
   *     summary: Cancel a trainer session by ID
   *     description: Cancels a session owned by the authenticated trainer.
   *     tags:
   *       - Session
   *     security:
   *       - ApiKey: []
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
   *         description: Session cancelled successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - message
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Session cancelled successfully.
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
   *         description: Failed to cancel session
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - message
   *               properties:
   *                 message:
   *                   type: string
   */
  static async cancelSession(req, res) {
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
          message: "You can only cancel your own sessions.",
        });
      }

      await SessionModel.delete(id);

      return res.status(200).json({
        message: "Session cancelled successfully.",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to cancel session from database.",
      });
    }
  }
}
