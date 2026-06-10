import { DatabaseModel } from "./DatabaseModel.mjs";

/**
 * SessionModel
 *
 * Represents a gym session entity stored in the database.
 *
 * This model handles:
 * - CRUD operations for sessions
 * - Mapping database rows into structured objects
 * - Joining session data with related entities (activity, location, user)
 *
 * It supports both:
 * - raw session records
 * - joined session views (via getAllWithDetails)
 */
export class SessionModel extends DatabaseModel {

  /**
   * Creates a SessionModel instance
   *
   * @param {number} id - Session ID
   * @param {number} user_id - Trainer/User ID who created session
   * @param {number} location_id - Location ID
   * @param {number} activity_id - Activity ID
   * @param {string|Date} date - Session date
   * @param {string} start_time - Start time (HH:MM)
   * @param {string} end_time - End time (HH:MM)
   */
  constructor(id, user_id, location_id, activity_id, date, start_time, end_time) {
    super();

    this.id = id;
    this.user_id = user_id;
    this.location_id = location_id;
    this.activity_id = activity_id;
    this.date = date;
    this.start_time = start_time;
    this.end_time = end_time;
  }

  /**
   * Maps a database row into a SessionModel instance
   *
   * Supports both:
   * - plain session rows
   * - joined rows containing { session: {...} }
   *
   * @param {Object} row - database row
   * @returns {SessionModel}
   */
  static tableToModel(row) {
    const r = row.session || row;

    return new SessionModel(
      r.id,
      r.user_id,
      r.location_id,
      r.activity_id,
      r.date,
      r.start_time?.substring(0, 5) || "",
      r.end_time?.substring(0, 5) || ""
    );
  }

  /**
   * Retrieves all non-deleted sessions
   *
   * @returns {Promise<SessionModel[]>}
   */
  static async getAll() {
    const rows = await this.query(`
      SELECT *
      FROM session
      WHERE deleted = 0
      ORDER BY date DESC
    `);

    return rows.map(row => this.tableToModel(row));
  }

  /**
   * Retrieves a session by ID
   *
   * @param {number} id
   * @returns {Promise<SessionModel|null>}
   */
  static async getById(id) {
    const rows = await this.query(`
      SELECT *
      FROM session
      WHERE id = ?
      AND deleted = 0
    `, [id]);

    if (!rows.length) return null;

    return this.tableToModel(rows[0]);
  }

  /**
   * Creates a new session
   *
   * @param {Object} session
   * @param {number} session.user_id
   * @param {number} session.location_id
   * @param {number} session.activity_id
   * @param {string} session.date
   * @param {string} session.start_time
   * @param {string} session.end_time
   * @returns {Promise<any>}
   */
  static async create(session) {
    return this.query(`
      INSERT INTO session
      (user_id, location_id, activity_id, date, start_time, end_time, deleted)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `, [
      session.user_id,
      session.location_id,
      session.activity_id,
      session.date,
      session.start_time,
      session.end_time
    ]);
  }

  /**
   * Updates an existing session
   *
   * @param {Object} session
   * @param {number} session.id
   * @param {number} session.user_id
   * @param {number} session.location_id
   * @param {number} session.activity_id
   * @param {string} session.date
   * @param {string} session.start_time
   * @param {string} session.end_time
   * @returns {Promise<any>}
   */
  static async update(session) {
    return this.query(`
      UPDATE session
      SET user_id = ?, location_id = ?, activity_id = ?, date = ?, start_time = ?, end_time = ?
      WHERE id = ?
      AND deleted = 0
    `, [
      session.user_id,
      session.location_id,
      session.activity_id,
      session.date,
      session.start_time,
      session.end_time,
      session.id
    ]);
  }

  /**
   * Permanently deletes a session
   *
   * ⚠️ WARNING: This is a HARD DELETE (not soft delete)
   *
   * @param {number} id
   * @returns {Promise<any>}
   */
  static async delete(id) {
    return this.query(`
      DELETE FROM session
      WHERE id = ?
    `, [id]);
  }

  /**
   * Retrieves all sessions with joined details:
   * - user (trainer)
   * - location
   * - activity
   *
   * @returns {Promise<Array>}
   */
  static async getAllWithDetails() {
    const rows = await this.query(`
      SELECT
        session.id,
        session.user_id,
        session.location_id,
        session.activity_id,
        session.date,
        session.start_time,
        session.end_time,

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

    return rows.map(row => ({
      session: new SessionModel(
        row.id,
        row.user_id,
        row.location_id,
        row.activity_id,
        row.date,
        row.start_time?.substring(0, 5) || "",
        row.end_time?.substring(0, 5) || ""
      ),

      user: {
        id: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name
      },

      location: {
        id: row.location_id,
        name: row.location_name
      },

      activity: {
        id: row.activity_id,
        name: row.activity_name
      }
    }));
  }
}

// TESTING
// SessionModel.getAll().then(console.log);
// SessionModel.getAllWithDetails().then(console.log);
// SessionModel.getByTrainer(1).then(console.log);