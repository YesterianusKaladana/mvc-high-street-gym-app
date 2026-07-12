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
   * @openapi
   * /api/user:
   *   post:
   *     summary: Register a new member
   *     tags:
   *       - User
   *
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
   *                 example: user@gmail.com
   *               password:
   *                 type: string
   *                 example: password123
   *
   *     responses:
   *       201:
   *         description: User created successfully
   *
   *       400:
   *         description: Missing required fields
   *
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
        message: "Failed to create user",

        errors: [
          {
            path: req.path,
            message: error.message,
          },
        ],
      });
    }
  }

  /**
   * @openapi
   * /api/user/self:
   *   get:
   *     summary: Get current authenticated user
   *     tags:
   *       - User
   *
   *     security:
   *       - ApiKey: []
   *
   *     responses:
   *
   *       200:
   *         description: Current user information
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/User"
   *
   *       401:
   *         $ref: "#/components/responses/Unauthorized"
   *
   *       403:
   *         $ref: "#/components/responses/Forbidden"
   *
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async getAuthenticatedUser(req, res) {
    return res.status(200).json(req.authenticatedUser);
  }

  /**
   * @openapi
   * /api/user/{id}:
   *   get:
   *     summary: Get user by ID
   *     tags:
   *       - User
   *
   *     security:
   *       - ApiKey: []
   *
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *
   *     responses:
   *
   *       200:
   *         description: User found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/User"
   *
   *       401:
   *         $ref: "#/components/responses/Unauthorized"
   *
   *       403:
   *         $ref: "#/components/responses/Forbidden"
   *
   *       404:
   *         $ref: "#/components/responses/NotFound"
   *
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async getUserById(req, res) {
    try {
      const requestedId = Number(req.params.id);

      const user = req.authenticatedUser;

      if (Number.isNaN(requestedId)) {
        return res.status(400).json({
          message: "Invalid user ID",
        });
      }

      if (!user || (user.id !== requestedId && user.role !== "admin")) {
        return res.status(403).json({
          message: "Forbidden",
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
        message: "Failed to load user",

        errors: [
          {
            path: req.path,
            message: error.message,
          },
        ],
      });
    }
  }

  /**
   * @openapi
   * /api/user/{id}:
   *   patch:
   *     summary: Update user information
   *     tags:
   *       - User
   *
   *     security:
   *       - ApiKey: []
   *
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *
   *     responses:
   *
   *       200:
   *         $ref: "#/components/responses/Updated"
   *
   *       401:
   *         $ref: "#/components/responses/Unauthorized"
   *
   *       403:
   *         $ref: "#/components/responses/Forbidden"
   *
   *       404:
   *         $ref: "#/components/responses/NotFound"
   *
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async UserPersonalInformation(req, res) {
    try {
      const user = req.authenticatedUser;

      const targetUserId = Number(req.params.id);

      if (!user || user.id !== targetUserId) {
        return res.status(403).json({
          message: "You are not allowed to update this user",
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
        message: "User not found",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Failed to update user",

        errors: [
          {
            path: req.path,
            message: error.message,
          },
        ],
      });
    }
  }
}
