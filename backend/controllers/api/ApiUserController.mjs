import express from "express";
import { ApiAuthenticationController } from "./ApiAuthenticationController.mjs";
import bcrypt from "bcryptjs";
import { UserModel } from "../../models/UserModel.mjs";

export class ApiUserController {
  static routes = express.Router();

  static {
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
     * Register a new  user 
     * @type {express.RequestHandler}
     * @openapi
     * /api/user:
     *   post:
     *     summary: "Register a new  user"
     *     tags: [User]
     *    
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: "#/components/schemas/User"
     *     responses:
     *       200:
     *         $ref: "#/components/responses/Created"
     *       500:
     *         $ref: "#/components/responses/Error"
     */
  static async createNewMember(req, res) {
    try {
      if (!req.body.email || !req.body.password) {
        return res.status(400).json({
          message: "Email and password are required",
        });
      } else {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

        const user = {
          ...req.body,
          password: hashedPassword,
          role: "member",
        };

        const result = await UserModel.create(user);
        res.status(201).json({
          id: result.insertedId,
          message: "Member created successfully",
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to create new user",
        erros: [error.message || error],
      });
    }
  }

  /**
   * Get user by ID
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
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         $ref: "#/components/responses/UserFound"
   *       404:
   *          $ref: "#/components/responses/NotFound"
   *       403:
   *        $ref: "#/components/responses/Forbidden"
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async getUserById(req, res) {
    try {
      const requestedId = parseInt(req.params.id);
      const authenticatedUser = req.authenticatedUser;

      // Only allow access if the user is owner or an admin
      if (
        !authenticatedUser ||
        (authenticatedUser.id !== requestedId &&
          authenticatedUser.role !== "admin")
      ) {
        return res.status(403).json({
          message: "Forbidden: You are not allowed to access this user's data",
          errors: ["Forbidden"],
        });
      } else {
        const user = await UserModel.getById(requestedId);
        if (!user) {
          return res.status(404).json({
            message: "User not found",
          });
        } else {
          res.status(200).json(user);
        }
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to load user from database",
      });
    }
  }

  /**
 * Update personal information
 * @type {express.RequestHandler}
 * @openapi
 * /api/user/{id}:
 *    patch :
 *     summary: "Update user information"
 *     tags: [User]
 *     security:
 *       - ApiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/User"
 *     responses:
 *       200:
 *         $ref: "#/components/responses/Updated"
 *       403:
 *         $ref: "#/components/responses/Forbidden"
          
 *       404:
 *         $ref: "#/components/responses/UserFound"
 *       500:
 *         $ref: "#/components/responses/Error"
 */
  static async UserPersonalInformation(req, res) {
    try {
      const authenticatedUser = req.authenticatedUser;
      const targettedUserId = parseInt(req.params.id);

      //TODO: only allowed user to update their own personal info
      if (!authenticatedUser.id !== targettedUserId) {
        return res.status(403).json({
          message: "You are not allowed to update this user.",
          errors: ["Forbidden"],
        });
      } else {
        const user = {
          ...req.body,
          authenticationKey: authenticatedUser.authenticationKey,
          id: req.params.id,
        };

        if (user.password) {
          const saltRounds = 10;
          user.password = await bcrypt.hash(user.password, saltRounds);
        }

        const result = await UserModel.update(user);
        if (result.affectedRows === 1) {
          res.status(200).json({
            message: "User updated successfully",
          });
        } else {
          res.status(404).json({
            message: "User not found - update failed",
            errors: ["Not found", "Update failed"],
          });
        }
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to update user",
        errors: [error.message || error],
      });
    }
  }

  /**
   * Handle getting an employee by their current authentication key
   *
   * @type {express.RequestHandler}
   * @openapi
   * /api/user/self:
   *    get:
   *        summary: "Get user by current authentication key"
   *        tags: [Users]
   *        security:
   *            - ApiKey: []
   *        responses:
   *            '200':
   *                description: "User with provided authentication key"
   *                content:
   *                    application/json:
   *                        schema:
   *                            $ref: "#/components/schemas/User"
   *            default:
   *                $ref: "#/components/responses/Error"
   */
  static async getAuthenticatedUser(req, res) {
    console.log(req.authenticatedUser);
    res.status(200).json(req.authenticatedUser);
  }
}
