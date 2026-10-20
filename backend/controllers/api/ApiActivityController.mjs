import express from "express";
import { ActivityModel } from "../../models/ActivityModel.mjs";

export class ApiActivityController {
  static routes = express.Router();

  static {
    /**
     * @openapi
     * /api/activity:
     *   get:
     *     summary: Get all gym activities
     *     tags:
     *       - Activity
     *     responses:
     *       200:
     *         description: Activities retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: integer
     *                     example: "1"
     *                   name:
     *                     type: string
     *                     example: "Yoga"
     *                   description:
     *                     type: string
     *                     example: "A relaxing and flexible yoga session"
     *       500:
     *         description: Failed to load activities
     */
    this.routes.get("/", this.getActivities);
  }

  static async getActivities(req, res) {
    try {
      const activities = await ActivityModel.getAll();
      return res.status(200).json(activities);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to load activities",
      });
    }
  }
}
