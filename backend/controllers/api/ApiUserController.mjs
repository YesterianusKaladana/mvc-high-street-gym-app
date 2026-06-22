import express from "express";
import { ApiAuthenticationController } from "./ApiAuthenticationController.mjs";
import bcrypt from "bcryptjs";
import { UserModel } from "../../models/UserModel.mjs";

export class ApiUserController {
  static routes = express.Router();

  static {
    this.routes.use(ApiAuthenticationController.middleware);

    this.routes.post("/", this.createNewMember);

    this.routes.get(
      "/self",
      ApiAuthenticationController.restrict(["any"]),
      this.getAuthenticatedUser,
    );

    this.routes.patch(
      "/:id",
      ApiAuthenticationController.restrict(["any"]),
      this.UserPersonalInformation,
    );

    this.routes.get(
      "/:id",
      ApiAuthenticationController.restrict(["any"]),
      this.getUserById,
    );
  }

  /**
   * Register a new user
   *
   * @type {express.RequestHandler}
   * @openapi
   * /api/user:
   *   post:
   *     summary: "Register a new user"
   *     tags: [User]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 example: test@example.com
   *               password:
   *                 type: string
   *                 example: password123
   *               name:
   *                 type: string
   *                 example: John Doe
   *     responses:
   *       201:
   *         description: Member created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 message:
   *                   type: string
   *       400:
   *         description: Missing required fields
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async createNewMember(req, res) {
    try {
      if (!req.body.email || !req.body.password) {
        return res.status(400).json({
          message: "Email and password are required",
        });
      }

      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      const user = {
        ...req.body,
        password: hashedPassword,
        role: "member",
      };

      const result = await UserModel.create(user);

      return res.status(201).json({
        id: result.insertId,
        message: "Member created successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to create new user",
        errors: [error.message || error],
      });
    }
  }

  /**
   * Get user by ID
   *
   * @type {express.RequestHandler}
   * @openapi
   * /api/user/{id}:
   *   get:
   *     summary: "Get user by ID"
   *     tags: [User]
   *     security:
   *       - ApiKey: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         description: User ID
   *         schema:
   *           type: integer
   *           example: 1
   *     responses:
   *       200:
   *         description: User found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/User"
   *       400:
   *         description: Invalid user ID
   *       403:
   *         description: Forbidden
   *       404:
   *         description: User not found
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async getUserById(req, res) {
    try {
      const requestedId = Number(req.params.id);
      const user = req.user;

      if (Number.isNaN(requestedId)) {
        return res.status(400).json({
          message: "Invalid user ID",
        });
      }

      if (!user || (user.id !== requestedId && user.role !== "admin")) {
        return res.status(403).json({
          message: "Forbidden: You are not allowed to access this user's data",
        });
      }

      const foundUser = await UserModel.getById(requestedId);

      if (!foundUser) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      return res.status(200).json(foundUser);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to load user from database",
      });
    }
  }

  /**
   * Update user personal information
   *
   * @type {express.RequestHandler}
   * @openapi
   * /api/user/{id}:
   *   patch:
   *     summary: "Update user information"
   *     tags: [User]
   *     security:
   *       - ApiKey: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           example: 1
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: User updated successfully
   *       400:
   *         description: Invalid request
   *       403:
   *         description: Forbidden
   *       404:
   *         description: User not found
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async UserPersonalInformation(req, res) {
    try {
      const user = req.user;
      const targetUserId = Number(req.params.id);

      if (!user || user.id !== targetUserId) {
        return res.status(403).json({
          message: "You are not allowed to update this user.",
        });
      }

      const updateData = {
        ...req.body,
        id: targetUserId,
      };

      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const result = await UserModel.update(updateData);

      if (result.affectedRows === 1) {
        return res.status(200).json({
          message: "User updated successfully",
        });
      }

      return res.status(404).json({
        message: "User not found - update failed",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to update user",
      });
    }
  }

  /**
   * Get current authenticated user
   *
   * @type {express.RequestHandler}
   * @openapi
   * /api/user/self:
   *   get:
   *     summary: "Get current authenticated user"
   *     tags: [User]
   *     security:
   *       - ApiKey: []
   *     responses:
   *       200:
   *         description: Current user data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/User"
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async getAuthenticatedUser(req, res) {
    return res.status(200).json(req.user);
  }
}
