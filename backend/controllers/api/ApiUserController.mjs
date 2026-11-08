import express from "express";
import { ApiAuthenticationController } from "./ApiAuthenticationController.mjs";
import bcrypt from "bcryptjs";
import { UserModel } from "../../models/UserModel.mjs";
import validator from "validator";

export class ApiUserController {
  static routes = express.Router();

  static {
    this.routes.use(ApiAuthenticationController.middleware);

    this.routes.post("/register", this.createNewMember);

    this.routes.get(
      "/",
      ApiAuthenticationController.restrict("admin"),
      this.getAllUsers,
    );

    this.routes.get(
      "/self",
      ApiAuthenticationController.restrict("any"),
      this.getAuthenticatedUser,
    );

    this.routes.patch(
      "/self",
      ApiAuthenticationController.restrict("any"),
      this.UserPersonalInformation,
    );

    this.routes.get(
      "/:id",
      ApiAuthenticationController.restrict("any"),
      this.getUserById,
    );
  }

  /**
   * @openapi
   * /api/user/self:
   *   get:
   *     summary: Get current authenticated user
   *     tags:
   *       - User
   *     security:
   *       - ApiKey: []
   *     responses:
   *       200:
   *         description: Current user information
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/User"
   *       401:
   *         $ref: "#/components/responses/Unauthorized"
   *       403:
   *         $ref: "#/components/responses/Forbidden"
   *       404:
   *         $ref: "#/components/responses/NotFound"
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async getAuthenticatedUser(req, res) {
    return res.status(200).json(req.authenticatedUser);
  }

  /**
   * @openapi
   * /api/user:
   *   get:
   *     summary: Get all active users
   *     description: Retrieves all active users. Only administrators can access this endpoint. Passwords and authentication keys are excluded from the response.
   *     tags:
   *       - User
   *     security:
   *       - ApiKey: []
   *     responses:
   *       200:
   *         description: List of active users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: integer
   *                     example: 52
   *                   firstName:
   *                     type: string
   *                     example: Jane
   *                   lastName:
   *                     type: string
   *                     example: Doe
   *                   role:
   *                     type: string
   *                     example: member
   *                   email:
   *                     type: string
   *                     format: email
   *                     example: jane@gmail.com
   *       401:
   *         $ref: "#/components/responses/Unauthorized"
   *       403:
   *         $ref: "#/components/responses/Forbidden"
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async getAllUsers(req, res) {
    try {
      const users = await UserModel.getAll();

      // Exclude passwords and authentication keys
      const safeUsers = users.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        email: user.email,
      }));

      return res.status(200).json(safeUsers);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to load users from database.",
      });
    }
  }

  /**
   * @openapi
   * /api/user/register:
   *   post:
   *     summary: Create a new member
   *     tags:
   *       - User
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - firstName
   *               - lastName
   *               - role
   *               - email
   *               - password
   *             properties:
   *               firstName:
   *                 type: string
   *                 example: "John"
   *               lastName:
   *                 type: string
   *                 example: "Doe"
   *               role:
   *                 type: string
   *                 example: "member"
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "user@gmail.com"
   *               password:
   *                 type: string
   *                 example: "password123"
   *     responses:
   *       201:
   *         $ref: "#/components/responses/Created"
   *       400:
   *         $ref: "#/components/responses/BadRequest"
   *       401:
   *         $ref: "#/components/responses/Unauthorized"
   *       409:
   *         description: Conflict - Email already registered
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "This email is already registered. Please use another email."
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async createNewMember(req, res) {
    try {
      const { firstName, lastName, role, email, password } = req.body;

      // Validate first name
      if (
        !firstName ||
        !/^[A-Z][a-zA-Z\-'\s]*$/.test(firstName) ||
        firstName.length < 2
      ) {
        return res.status(400).json({
          message:
            "First name must start with a capital letter and contain only letters.",
        });
      }

      // Validate last name
      if (!lastName || !/^[A-Z][a-zA-Z\-'\s]*$/.test(lastName)) {
        return res.status(400).json({
          message:
            "Last name must start with a capital letter and contain only letters.",
        });
      }

      // Validate email
      if (!email || !validator.isEmail(email)) {
        return res.status(400).json({
          message: "Please provide a valid email address.",
        });
      }

      // Validate password
      if (!password || password.length < 4) {
        return res.status(400).json({
          message: "Password must be at least 4 characters long.",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = {
        firstName: firstName,
        lastName: lastName,
        role: role || "member",
        email: email,
        password: hashedPassword,
      };

      // Create the new member
      const result = await UserModel.create(user);

      return res.status(201).json({
        id: result.insertId,
        message: "Member created successfully",
      });
    } catch (error) {
      // Handle duplicate email
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          message:
            "This email is already registered. Please use another email.",
        });
      }

      // Handle other database errors
      console.error(error);

      return res.status(500).json({
        message: "Failed to create user from database.",
      });
    }
  }

  /**
   * @openapi
   * /api/user/{id}:
   *   get:
   *     summary: Get user by ID
   *     tags:
   *       - User
   *     security:
   *       - ApiKey: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: User found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/User"
   *       400:
   *         $ref: "#/components/responses/BadRequest"
   *       401:
   *         $ref: "#/components/responses/Unauthorized"
   *       403:
   *         $ref: "#/components/responses/Forbidden"
   *       404:
   *         $ref: "#/components/responses/NotFound"
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
        message: "Failed to load user from database.",
      });
    }
  }

  /**
   * @openapi
   * /api/user/self:
   *   patch:
   *     summary: Update personal information
   *     description: Updates the authenticated user's personal information.
   *     tags:
   *       - User
   *     security:
   *       - ApiKey: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - firstName
   *               - lastName
   *               - email
   *             properties:
   *               firstName:
   *                 type: string
   *                 example: John
   *               lastName:
   *                 type: string
   *                 example: Smith
   *               email:
   *                 type: string
   *                 format: email
   *                 example: john@gmail.com
   *     responses:
   *       200:
   *         $ref: "#/components/responses/Updated"
   *       400:
   *         $ref: "#/components/responses/BadRequest"
   *       401:
   *         $ref: "#/components/responses/Unauthorized"
   *       404:
   *         $ref: "#/components/responses/NotFound"
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async UserPersonalInformation(req, res) {
    try {
      const user = req.authenticatedUser;
      const targetUserId = user.id;

      const { firstName, lastName, email } = req.body;

      if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
        return res.status(400).json({
          message: "First name, last name and email are required",
        });
      }

      const updateData = {
        id: targetUserId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      };

      const result = await UserModel.updatePersonalInformation(updateData);

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
        message: "Failed to update user from database.",
      });
    }
  }
}
