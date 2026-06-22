import express from "express";
import swaggerJSDoc from "swagger-jsdoc";
import SwaggerUI from "swagger-ui-express";
import * as ApiValidator from "express-openapi-validator";
import { ApiAuthenticationController } from "./ApiAuthenticationController.mjs";
import { ApiSessionsController } from "./ApiSessionsController.mjs";
import { ApiUserController } from "./ApiUserController.mjs";
import { ApiPostController } from "./ApiPostController.mjs";
import { ApiBookingsController } from "./ApiBookingsController.mjs";

// Swagger/OpenAPI specification options
const options = {
  failOnErrors: true,
  definition: {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "High Street Gym API",
      description:
        "JSON REST API for interacting with the High Street Gym Backend",
    },
    components: {
      securitySchemes: {
        ApiKey: {
          type: "apiKey",
          in: "header",
          name: "x-auth-key",
        },
      },
    },
  },
  apis: ["./controllers/API/**/*.{js,mjs,yaml}", "./components.yaml"], // ensure paths are correct
};

const specification = swaggerJSDoc(options);

export class ApiController {
  static routes = express.Router();

  static {
    //TODO: Swager API documentation
    /**
     * @openapi
     * /api/docs:
     *   get:
     *     summary: View automatically generated API documentation
     *     tags:
     *       - documentation
     *     responses:
     *       200:
     *         description: Swagger documentation page
     */
    this.routes.use("/docs", SwaggerUI.serve, SwaggerUI.setup(specification));

    //TODO: Set up validator
    this.routes.use(
      ApiValidator.middleware({
        apiSpec: specification,
        validateRequests: true,
        validateResponses: true,
      }),
    );

    //TODO: Set up error response handling (in JSON format)
    this.routes.use((err, req, res, next) => {
      res.status(err.status || 500).json({
        message: err.message,
        errors: err.errors,
      });
    });

    // Authentication Middleware and Routes
    this.routes.use(ApiAuthenticationController.middleware);
    this.routes.use(ApiAuthenticationController.routes);

    // Mount Resources Endpoints
    this.routes.use("/sessions", ApiSessionsController.routes);
    this.routes.use("/post", ApiPostController.routes);
    this.routes.use("/user", ApiUserController.routes);
    this.routes.use("/bookings", ApiBookingsController.routes);
  }
}
