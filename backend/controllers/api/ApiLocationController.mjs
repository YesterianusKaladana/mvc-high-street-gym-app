import express from "express";
import { LocationModel } from "../../models/LocationModel.mjs";

export class ApiLocationController {
  static routes = express.Router();

  static {
    /**
     * @openapi
     * /api/location:
     *   get:
     *     summary: Get all gym locations
     *     tags:
     *       - Location
     *     responses:
     *       200:
     *         description: Locations retrieved successfully
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
     *                     example: "Brisbane City"
     *                   description:
     *                     type: string
     *                     example: "Level A Fitness Center"
     *       500:
     *         description: Failed to load locations
     */
    this.routes.get("/", this.getLocations);
  }

  static async getLocations(req, res) {
    try {
      const locations = await LocationModel.getAll();
      return res.status(200).json(locations);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to load locations",
      });
    }
  }
}
