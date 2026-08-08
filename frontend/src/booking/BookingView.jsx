import { useEffect, useState } from "react";

function BookingView() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const savedBookings = JSON.parse(localStorage.getItem("bookings")) || [];

    setBookings(savedBookings);
  }, []);

  const removeBooking = (sessionId) => {
    const updatedBookings = bookings.filter(
      (booking) => booking.session_id !== sessionId,
    );

    setBookings(updatedBookings);

    localStorage.setItem("bookings", JSON.stringify(updatedBookings));
  };

  return (
    <section className="p-4">
      <h1 className="text-2xl font-bold mb-4">My Bookings</h1>

      {bookings.length === 0 ? (
        <p className="opacity-60">You don't have any bookings yet.</p>
      ) : (
        <ul className="list">
          {bookings.map((booking) => (
            <li key={booking.session_id} className="list-row">
              <div>
                <div className="font-bold">{booking.activity_name}</div>

                <div className="text-sm">{booking.location_name}</div>

                <div className="text-sm opacity-70">
                  {booking.date} ({booking.weekday})
                </div>

                <div className="text-sm opacity-70">
                  {booking.start_time} - {booking.end_time}
                </div>

                <div className="text-sm opacity-70">
                  Trainer: {booking.trainer_name}
                </div>
              </div>

              <button
                className="btn btn-error btn-outline"
                onClick={() => removeBooking(booking.session_id)}
              >
                Cancel
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default BookingView;
