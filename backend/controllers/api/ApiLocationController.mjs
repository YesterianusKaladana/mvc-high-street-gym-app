import express from "express";
import { LocationModel } from "../../models/LocationModel.mjs";

export class ApiLocationController {
  static routes = express.Router();

  static {
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
