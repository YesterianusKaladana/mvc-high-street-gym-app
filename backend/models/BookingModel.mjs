import { DatabaseModel } from "./DatabaseModel.mjs";

export class BookingModel extends DatabaseModel {
  /**
   * Represents a booking record.
   *
   * @param {number} id - Booking ID
   * @param {number} sessionId - Related session ID
   * @param {string|Date} created - Creation timestamp
   * @param {number} userId - User who created the booking
   * @param {number} deleted - Soft delete flag (0 = active, 1 = deleted)
   */
  constructor(id, sessionId, created, userId, deleted = 0) {
    super();
    this.id = id;
    this.sessionId = sessionId;
    this.created = created;
    this.userId = userId;
    this.deleted = deleted;
  }

  /**
   * Converts a database row into a BookingModel instance.
   *
   * Handles nested MySQL results when using `nestTables: true`.
   *
   * @param {Object} row - Raw database row
   * @returns {BookingModel}
   */
  static tableToModel(row) {
    const b = row.booking ?? row;

    return new BookingModel(
      b.id,
      b.session_id,
      b.created,
      b.user_id,
      b.deleted,
    );
  }

  /**
   * Retrieves all bookings from the database.
   *
   * @returns {Promise<BookingModel[]>}
   */
  static async getAll() {
    const rows = await this.query(`
      SELECT *
      FROM booking
      WHERE deleted = 0
    `);

    return rows.map((row) => this.tableToModel(row));
  }

  /**
   * Retrieves a booking by its ID.
   *
   * @param {number} id - Booking ID
   * @returns {Promise<BookingModel|null>}
   */
  static async getById(id) {
    const rows = await this.query(
      "SELECT * FROM booking WHERE id = ? AND deleted = 0",
      [id],
    );

    return rows.length ? this.tableToModel(rows[0]) : null;
  }

  /**
   * Retrieves all bookings for a specific user.
   *
   * @param {number} userId - User ID
   * @returns {Promise<BookingModel[]>}
   */
  static async getByUserId(userId) {
    const rows = await this.query(
      `
      SELECT *
      FROM booking
      WHERE user_id = ? AND deleted = 0
    `,
      [userId],
    );

    return rows.map((row) => this.tableToModel(row));
  }

  /**
   * Finds an active booking for a user and session.
   *
   * @param {number} userId - User ID
   * @param {number} sessionId - Session ID
   * @returns {Promise<BookingModel|null>}
   */
  static async find(userId, sessionId) {
    const rows = await this.query(
      `
      SELECT *
      FROM booking
      WHERE user_id = ? AND session_id = ? AND deleted = 0
    `,
      [userId, sessionId],
    );

    return rows.length ? this.tableToModel(rows[0]) : null;
  }

  /**
   * Creates a new booking record.
   *
   * @param {Object} booking
   * @param {number} booking.sessionId - Session ID
   * @param {number} booking.userId - User ID
   * @returns {Promise<any>}
   */
  static async create(booking) {
    const created = new Date().toISOString().slice(0, 19).replace("T", " ");

    return this.query(
      `
      INSERT INTO booking (session_id, created, user_id, deleted)
      VALUES (?, ?, ?, 0)
    `,
      [booking.sessionId, created, booking.userId],
    );
  }

  /**
   * Updates an existing booking record.
   *
   * @param {Object} booking
   * @param {number} booking.id - Booking ID
   * @param {number} booking.session_id - Session ID
   * @param {number} booking.user_id - User ID
   * @param {string|Date} booking.created - Timestamp
   * @returns {Promise<any>}
   */
  static async update(booking) {
    return this.query(
      `
      UPDATE booking
      SET session_id = ?, created = ?, user_id = ?
      WHERE id = ?
      `,
      [booking.sessionId, booking.created, booking.userId, booking.id],
    );
  }

  /**
   * Soft deletes a booking (marks as deleted = 1).
   *
   * @param {number} id - Booking ID
   * @returns {Promise<any>}
   */
  static async delete(id) {
    return this.query("DELETE FROM booking WHERE id = ?", [id]);
  }
}

// TESTING AREA
// BookingModel.getAll().then((booking) => console.log(booking));
