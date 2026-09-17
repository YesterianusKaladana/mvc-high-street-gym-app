import { FaSearch } from "react-icons/fa";

function MySessionsView() {
  return (
    <section className="flex flex-col items-center">
      <div className="join p-4 self-stretch">
        <input
          type="text"
          className="input join-item grow"
          placeholder="search trainer sessions"
        />
        <button className="btn join-item">
          <FaSearch />
        </button>
      </div>

      {/* <span className="p-4 self-center text-red-500">Status loading text...</span>
      <span className="loading loading-spinner loading-xl"></span> */}

      <p>This is trainer sessions management page.</p>

    </section>
  );
}

export default MySessionsView;
