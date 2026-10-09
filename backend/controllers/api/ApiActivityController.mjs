import express from "express";
import { ActivityModel } from "../../models/ActivityModel.mjs";

export class ApiActivityController {
  static routes = express.Router();

  static {
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
