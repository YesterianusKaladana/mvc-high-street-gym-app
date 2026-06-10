// test.mjs

import { BookingActivityModel } from "./BookingActivityModel.mjs";
import { UserPostModel } from "./UserPostModel.mjs";
import { SessionActivityModel } from "./SessionActivityModel.mjs";
import { UserModel } from "./UserModel.mjs";

console.log("=== USERS ===");

const users = await UserModel.getAll();

console.log(users);

console.log("=== USER POST DETAILS ===");

const userPost = await UserPostModel.getById(1);

console.log(userPost);

console.log("=== SESSION DETAILS ===");

const sessions = await SessionActivityModel.getByUserId(7);

console.log(sessions);

console.log("=== BOOKING DETAILS ===");

const bookingActivity = await BookingActivityModel.getAll();

console.log(bookingActivity);
