import { DatabaseModel } from "./DatabaseModel.mjs";

export class BookingActivityModel extends DatabaseModel {

    /**
     * MEMBER BOOKINGS (FULL DETAILS)
     */
    static async getByMember(userId) {
        const rows = await this.query(`
            SELECT 
                b.id AS booking_id,
                b.user_id,
                b.session_id,
                b.created,
                b.deleted,

                s.id AS session_id,
                s.date AS session_date,
                s.start_time,
                s.end_time,

                a.name AS activity_name,
                l.name AS location_name

            FROM booking b
            INNER JOIN session s ON b.session_id = s.id
            INNER JOIN activity a ON s.activity_id = a.id
            INNER JOIN location l ON s.location_id = l.id

            WHERE b.user_id = ? 
            AND b.deleted = 0
        `, [userId]);

        return rows.map(row => ({
            booking: {
                id: row.booking_id,
                userId: row.user_id,
                sessionId: row.session_id,
                created: row.created,
                deleted: row.deleted
            },

            session: {
                id: row.session_id,
                date: row.session_date,
                start_time: row.start_time,
                end_time: row.end_time
            },

            activity: {
                name: row.activity_name
            },

            location: {
                name: row.location_name
            }
        }));
    }


    /**
     * ADMIN / FULL DETAILS
     */
    static async getAllWithDetails() {

        const rows = await this.query(`
            SELECT
                b.id AS booking_id,
                b.user_id,
                b.session_id,

                s.id AS session_id,
                s.date,
                s.start_time,
                s.end_time,

                a.id AS activity_id,
                a.name AS activity_name,

                l.id AS location_id,
                l.name AS location_name

            FROM booking b
            INNER JOIN session s ON b.session_id = s.id
            INNER JOIN activity a ON s.activity_id = a.id
            INNER JOIN location l ON s.location_id = l.id

            WHERE b.deleted = 0
        `);

        return rows.map(row => ({
            booking: {
                id: row.booking_id,
                userId: row.user_id,
                sessionId: row.session_id
            },

            session: {
                id: row.session_id,
                date: row.date,
                start_time: row.start_time,
                end_time: row.end_time
            },

            activity: {
                id: row.activity_id,
                name: row.activity_name
            },

            location: {
                id: row.location_id,
                name: row.location_name
            }
        }));
    }


    /**
     * SINGLE BOOKING (FIXED VERSION)
     */
    static async getById(id) {
        const rows = await this.query(`
            SELECT *
            FROM booking
            WHERE id = ?
            LIMIT 1
        `, [id]);

        return rows[0] || null;
    }
}