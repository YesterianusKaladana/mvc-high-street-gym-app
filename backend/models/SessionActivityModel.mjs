import { DatabaseModel } from "./DatabaseModel.mjs";
import { ActivityModel } from "./ActivityModel.mjs";
import { LocationModel } from "./LocationModel.mjs";
import { SessionModel } from "./SessionModel.mjs";
import { UserModel } from "./UserModel.mjs";

/**
 * SessionActivityModel
 *
 * Combined model that represents a full gym session with all related entities:
 *
 * - Session (core session data)
 * - Activity (e.g., Yoga, Boxing)
 * - Location (gym branch)
 * - User (trainer who created session)
 *
 * This model is used for:
 * - Public timetable views
 * - Trainer dashboards
 * - Member session browsing
 *
 * It simplifies complex JOIN queries into structured objects.
 */
export class SessionActivityModel extends DatabaseModel {
  /**
   * Creates a combined session object
   *
   * @param {SessionModel} session - Session data
   * @param {ActivityModel} activity - Activity details
   * @param {LocationModel} location - Location details
   * @param {UserModel} user - Trainer/user details
   */
  constructor(session, activity, location, user) {
    super();
    this.session = session;
    this.activity = activity;
    this.location = location;
    this.user = user;
  }

  /**
   * Maps a database JOIN row into SessionActivityModel
   *
   * Expected structure:
   * - row.session
   * - row.activity
   * - row.location
   * - row.user
   *
   * @param {Object} row - raw SQL result row
   * @returns {SessionActivityModel}
   */
  static tableToModel(row) {
    return new SessionActivityModel(
      SessionModel.tableToModel(row.session),
      ActivityModel.tableToModel(row.activity),
      LocationModel.tableToModel(row.location),
      UserModel.tableToModel(row.user),
    );
  }

  /**
   * Base SQL query for session + joins
   *
   * @returns {string}
   */
  static baseQuery() {
    return `
      SELECT *
      FROM session
      INNER JOIN activity ON session.activity_id = activity.id
      INNER JOIN location ON session.location_id = location.id
      INNER JOIN user ON session.user_id = user.id
      WHERE session.deleted = 0
    `;
  }

  /**
   * Retrieves all sessions with full details
   *
   * @returns {Promise<SessionActivityModel[]>}
   */
  static getAll() {
    return this.query(this.baseQuery()).then((rows) =>
      rows.map((row) => this.tableToModel(row)),
    );
  }

  /**
   * Retrieves a session by ID with full details
   *
   * @param {number} id - Session ID
   * @returns {Promise<SessionActivityModel|null>}
   */
  static getById(id) {
    return this.query(this.baseQuery() + " AND session.id = ?", [id]).then(
      (rows) => (rows.length ? this.tableToModel(rows[0]) : null),
    );
  }

  /**
   * Retrieves all sessions created by a specific user (trainer)
   *
   * @param {number} userId - Trainer ID
   * @returns {Promise<SessionActivityModel[]>}
   */
  static getByUserId(userId) {
    return this.query(this.baseQuery() + " AND session.user_id = ?", [
      userId,
    ]).then((rows) => rows.map((row) => this.tableToModel(row)));
  }

  /**
   * Retrieves all sessions with extended formatted details
   *
   *
   * @returns {Promise<Array>}
   */
  static async getAllWithDetails() {
    const rows = await this.query(`
        SELECT
          session.id AS session_id,
          session.date,
          session.start_time,
          session.end_time,
          session.capacity,

          user.first_name,
          user.last_name,

          location.name AS location_name,

          activity.name AS activity_name

        FROM session

        INNER JOIN user
          ON session.user_id = user.id

        INNER JOIN location
          ON session.location_id = location.id

        INNER JOIN activity
          ON session.activity_id = activity.id

        WHERE session.deleted = 0

        ORDER BY session.date DESC
    `);

    console.log("RAW ROWS:", rows);

    return rows.map((row) => ({
      session_id: row.session.session_id,

      activity_name: row.activity.activity_name,

      location_name: row.location.location_name,

      trainer_name: `${row.user.first_name} ${row.user.last_name}`,

      date: row.session.date,

      start_time: row.session.start_time?.substring(0, 5),

      end_time: row.session.end_time?.substring(0, 5),

      capacity: row.session.capacity,
    }));
  }
}
