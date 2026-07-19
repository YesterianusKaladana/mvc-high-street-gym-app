import express from "express";
import { UserModel } from "../../models/UserModel.mjs";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export class ApiAuthenticationController {
  static routes = express.Router();
  static middleware = express.Router();

  static {
    this.middleware.use(this.#APIAuthenticationProvider);
    this.routes.post("/authenticate", this.handleAuthenticate);
    this.routes.delete("/authenticate", this.handleAuthenticate);
  }

  /**
   * Middleware: loads user from API key
   */
  static async #APIAuthenticationProvider(req, res, next) {
    const authenticationKey = req.headers["x-auth-key"];

    if (authenticationKey) {
      try {
        req.authenticatedUser =
          await UserModel.getByAuthenticationKey(authenticationKey);
      } catch (error) {
        if (error == "not found") {
          return res.status(401).json({
            message: "Invalid authentication key - key not found",
          });
        } else {
          console.error(error);
          return res.status(500).json({
            message: "Failed to authenticate - database error",
          });
        }
      }
    }

    next();
  }

  /**
   * @openapi
   * /api/authenticate:
   *   post:
   *     summary: "Authenticate with email and password"
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/UserCredentials"
   *     responses:
   *       '200':
   *         $ref: "#/components/responses/LoginSuccessful"
   *       '401':
   *         $ref: "#/components/responses/Unauthorized"
   *       '500':
   *         $ref: "#/components/responses/Error"
   *
   *   delete:
   *     summary: "Deauthenticate with API key header"
   *     tags: [Authentication]
   *     security:
   *       - ApiKey: []
   *     responses:
   *       '200':
   *         $ref: "#/components/responses/Updated"
   *       '401':
   *         $ref: "#/components/responses/Unauthorized"
   *       '500':
   *         $ref: "#/components/responses/Error"
   */
  static async handleAuthenticate(req, res) {
    if (req.method == "POST") {
      try {
        const user = await UserModel.getByEmail(req.body.email);

        // prevent crash when user doesn't exist
        if (!user) {
          return res.status(401).json({
            message: "Invalid email or password",
          });
        }

        const passwordMatch = await bcrypt.compare(
          req.body.password,
          user.password,
        );

        if (!passwordMatch) {
          return res.status(401).json({
            message: "Invalid email or password",
          });
        }

        const authenticationKey = crypto.randomUUID();
        user.authenticationKey = authenticationKey;
        await UserModel.update(user);

        return res.status(200).json({
          authenticationKey,
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({
          message: "Failed to authenticate user",
        });
      }
    }

    if (req.method == "DELETE") {
      try {
        if (!req.authenticatedUser) {
          return res.status(401).json({
            message: "Please login to access the requested resources",
          });
        }

        const user = await UserModel.getByAuthenticationKey(
          req.authenticatedUser.authenticationKey,
        );

        user.authenticationKey = null;
        await UserModel.update(user);

        return res.status(200).json({
          message: "Deauthentication successful",
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({
          message: "Failed to deauthenticate user",
        });
      }
    }
  }

  /**
   * Role restriction middleware
   */
  static restrict(allowedRoles) {
    return function (req, res, next) {
      if (!req.authenticatedUser) {
        return res.status(401).json({
          message: "Not authenticated",
          errors: [
            {
              message: "Please authenticate to access the requested resource",
            },
          ],
        });
      }

      if (
        allowedRoles !== "any" &&
        !allowedRoles.includes(req.authenticatedUser.role)
      ) {
        return res.status(403).json({
          message: "Access forbidden",
          errors: [
            {
              message: "Role does not have access to the requested resource",
            },
          ],
        });
      }

      next();
    };
  }
}
