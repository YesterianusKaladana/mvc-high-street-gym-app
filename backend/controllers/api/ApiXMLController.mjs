import express from "express";
import { ApiAuthenticationController } from "./ApiAuthenticationController.mjs";
import { SessionActivityModel } from "../../models/SessionActivityModel.mjs";

export class ApiXMLController {
  static routes = express.Router();

  static {
    this.routes.get(
      "/session",
      ApiAuthenticationController.restrict(["admin", "member", "trainer"]),
      ApiXMLController.handleExportSessions,
    );
  }

  /**
   * @openapi
   * /api/xml/session:
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
  static async handleExportSessions(req, res) {
    try {
      const sessions = await SessionActivityModel.getAllWithDetails();

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <sessions>
      ${sessions
        .map(
          (session) => `  <session>
          <session_id>${escapeXml(session.session_id)}</session_id>
          <trainer_name>${escapeXml(session.trainer_name)}</trainer_name>
          <location_name>${escapeXml(session.location_name)}</location_name>
          <activity_name>${escapeXml(session.activity_name)}</activity_name>
          <date>${escapeXml(session.date)}</date>
          <start_time>${escapeXml(session.start_time)}</start_time>
          <end_time>${escapeXml(session.end_time)}</end_time>
          <capacity>${escapeXml(session.capacity)}</capacity>
        </session>`,
        )
        .join("\n")}
      </sessions>`;

      res.status(200).type("application/xml").send(xml);
    } catch (error) {
      console.error("Failed to export sessions:", error);

      res.status(500).json({
        message: "Failed to export sessions",
      });
    }
  }
}

/**
 * Escapes special XML characters.
 *
 * @param {*} value
 * @returns {string}
 */
function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
