import { DatabaseModel } from "./DatabaseModel.mjs";

/**
 * Represents a gym location in the system.
 * Handles all CRUD operations for location data.
 */
export class LocationModel extends DatabaseModel {

  /**
   * Creates a new LocationModel instance.
   *
   * @param {number} id - The unique ID of the location.
   * @param {string} name - The location name.
   * @param {string} description - The location description.
   */
  constructor(id, name, description) {
    super();

    this.id = id;
    this.name = name;
    this.description = description;

  }

  /**
   * Converts a database table row into a LocationModel object.
   *
   * Works with:
   * - normal rows
   * - aliased queries
   */
  static tableToModel(row) {
    const locationRow = row.location || row.locations || row;
    return new LocationModel(
      locationRow.id,
      locationRow.name,
      locationRow.description
    );
  }

  /**
   * Gets all locations.
   *
   * @returns {Promise<LocationModel[]>}
   */
  static async getAll() {
    return this.query(
      "SELECT * FROM location"
    ).then((results) => {
      return results.map((row) => this.tableToModel(row));
    });
  }

  /**
   * Gets a location by ID.
   *
   * @param {number} id
   * @returns {Promise<LocationModel|null>}
   */
  static async getById(id) {
    return this.query(
      "SELECT * FROM location WHERE id = ?",
      [id]
    ).then((result) => {

      if (result.length > 0) {
        return this.tableToModel(result[0]);
      }
      return null;
    });
  }

  /**
   * Gets a location by name.
   *
   * @param {string} name
   * @returns {Promise<LocationModel|null>}
   */
  static async getByName(name) {
    return this.query(
      "SELECT * FROM location WHERE name = ?",
      [name]
    ).then((result) => {

      if (result.length > 0) {
        return this.tableToModel(result[0]);
      }

      return null;
    });
  }

  /**
   * Creates a new location.
   *
   * @param {LocationModel} location
   * @returns {Promise<any>}
   */
  static async create(location) {
    return this.query(
      `
      INSERT INTO location (name, description)
      VALUES (?, ?)
      `,
      [location.name, location.description]
    );
  }

  /**
   * Updates a location.
   *
   * @param {LocationModel} location
   * @returns {Promise<any>}
   */
  static async update(location) {
    return this.query(
      `
      UPDATE location
      SET name = ?, description = ?
      WHERE id = ?
      `,
      [
        location.name,
        location.description,
        location.id
      ]
    );
  }

  /**
   * Deletes a location.
   *
   * @param {number} id
   * @returns {Promise<any>}
   */
  static async delete(id) {
    return this.query(
      `
      DELETE FROM location
      WHERE id = ?
      `,
      [id]
    );
  }
}

// TESTING
// LocationModel.getAll().then((location) => console.log(location));