import { DatabaseModel } from "./DatabaseModel.mjs";

export class BookingActivityModel extends DatabaseModel {
  /**
   * MEMBER BOOKINGS (FULL DETAILS)
   *
   * Returns bookings in the flat structure
   * required by the OpenAPI Booking schema.
   */
  static async getByMember(userId) {
    const rows = await this.query(
      `
            SELECT
                b.id,
                b.user_id,
                b.session_id,
                b.created,
                b.deleted,

                session.date,
                session.start_time,
                session.end_time,

                activity.name AS activity_name,

                location.name AS location_name,

                user.first_name,
                user.last_name

            FROM booking b

            INNER JOIN session
                ON b.session_id = session.id

            INNER JOIN activity
                ON session.activity_id = activity.id

            INNER JOIN location
                ON session.location_id = location.id

            INNER JOIN user
                ON session.user_id = user.id

            WHERE b.user_id = ?
            AND b.deleted = 0

            ORDER BY session.date DESC
            `,
      [userId],
    );

    return rows.map((row) => ({
      id: row.b.id,
      session_id: row.b.session_id,
      user_id: row.b.user_id,
      created: row.b.created,

      activity_name: row.activity.activity_name,
      location_name: row.location.location_name,

      trainer_name: `${row.user.first_name} ${row.user.last_name}`.trim(),

      date: row.session.date,
      start_time: row.session.start_time?.substring(0, 5),
      end_time: row.session.end_time?.substring(0, 5),
    }));
  }

  /**
   * ADMIN / FULL DETAILS
   */
  static async getAllWithDetails() {
    const rows = await this.query(`
            SELECT
                b.id,
                b.user_id,
                b.session_id,
                b.created,
                b.deleted,

                s.date,
                s.start_time,
                s.end_time,

                a.id AS activity_id,
                a.name AS activity_name,

                l.id AS location_id,
                l.name AS location_name

            FROM booking b

            INNER JOIN session s
                ON b.session_id = s.id

            INNER JOIN activity a
                ON s.activity_id = a.id

            INNER JOIN location l
                ON s.location_id = l.id

            WHERE b.deleted = 0
        `);

    return rows.map((row) => ({
      id: row.b.id,
      session_id: row.b.session_id,
      user_id: row.b.user_id,
      created: row.b.created,

      activity_name: row.a.activity_name,
      location_name: row.l.location_name,

      date: row.s.date,
      start_time: row.s.start_time,
      end_time: row.s.end_time,

      activity_id: row.a.activity_id,
      location_id: row.l.location_id,
    }));
  }

  /**
   * SINGLE BOOKING
   */
  static async getById(id) {
    const rows = await this.query(
      `
            SELECT
                b.id,
                b.user_id,
                b.session_id,
                b.created,
                b.deleted,

                s.date,
                s.start_time,
                s.end_time,

                a.name AS activity_name,

                l.name AS location_name

            FROM booking b

            INNER JOIN session s
                ON b.session_id = s.id

            INNER JOIN activity a
                ON s.activity_id = a.id

            INNER JOIN location l
                ON s.location_id = l.id

            WHERE b.id = ?
            LIMIT 1
            `,
      [id],
    );

    if (!rows[0]) {
      return null;
    }

    const row = rows[0];

    return {
      id: row.b.id,
      session_id: row.b.session_id,
      user_id: row.b.user_id,
      created: row.b.created,
      deleted: row.b.deleted,

      activity_name: row.a.activity_name,
      location_name: row.l.location_name,

      date: row.s.date,
      start_time: row.s.start_time,
      end_time: row.s.end_time,
    };
  }
}
