import { RefObject, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaUsers, FaCalendarAlt, FaBell, FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../stores/auth-store";

// ------------------------------------------------

export default function AdminHomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const homeRef = useRef(null);
  const userRef = useRef(null);
  const societyRef = useRef(null);
  const eventRef = useRef(null);
  const notificationRef = useRef(null);

  const scrollToSection = (ref: RefObject<HTMLElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/");
  };

  return (
    <div className="bg-gradient-to-b from-indigo-50 via-white to-indigo-100">
      <nav className="fixed top-0 left-0 w-full bg-gray-800 text-white py-4 px-8 shadow-md z-50">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold">Admin Dashboard</h1>
          <div className="flex gap-6">
            <button className=" hover:bg-gray-300 rounded-md hover:text-slate-900 p-2 transition duration-300 ease-in-out" onClick={() => scrollToSection(homeRef)}>Home</button>
            <button className=" hover:bg-gray-300 rounded-md hover:text-slate-900 p-2 transition duration-300 ease-in-out" onClick={() => scrollToSection(userRef)}>Users</button>
            <button className=" hover:bg-gray-300 rounded-md hover:text-slate-900 p-2 transition duration-300 ease-in-out" onClick={() => scrollToSection(societyRef)}>Societies</button>
            <button className=" hover:bg-gray-300 rounded-md hover:text-slate-900 p-2 transition duration-300 ease-in-out" onClick={() => scrollToSection(eventRef)}>Events</button>
            <button className=" hover:bg-gray-300 rounded-md hover:text-slate-900 p-2 transition duration-300 ease-in-out" onClick={() => scrollToSection(notificationRef)}>Notifications</button>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 rounded-lg text-sm font-medium hover:bg-red-500 transition-all"
          >
            Logout
          </button>
        </div>
      </nav>

      <section ref={homeRef} className="h-screen flex flex-col justify-center px-8">
      <header className="h-screen flex flex-col justify-center items-center text-center px-8">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
          Welcome to your dashboard, {user?.first_name || "Admin"}!
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Manage students, events, societies, and notifications with ease.
        </p>
        <Link
          to="/profile"
          className="px-8 py-3 bg-gray-800 text-white rounded-lg hover:bg-slate-500 transition-all"
        >
          View Profile
        </Link>
      </header>
      </section>

      <section ref={userRef} className="h-screen flex flex-col justify-center px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold flex items-center">
            <FaUsers className="text-green-500 mr-3" />
            Manage Users
          </h2>
          <Link
            to="/student-list"
            className="text-blue-500 hover:underline font-medium"
          >
            View All Students
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg border border-gray-200 transition-transform hover:-translate-y-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Student 1</h3>
            <button className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-all">
              Remove User
            </button>
          </div>
        </div>
      </section>

      <section ref={societyRef} className="h-screen flex flex-col justify-center px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold flex items-center">
            <FaUsers className="text-green-500 mr-3" />
            Manage Societies
          </h2>
          <Link
            to="/society-list"
            className="text-blue-500 hover:underline font-medium"
          >
            View All Societies
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg border border-gray-200 transition-transform hover:-translate-y-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Basketball Society
            </h3>
            <button className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-all">
              Remove Society
            </button>
          </div>
        </div>
      </section>

      <section ref={eventRef} className="h-screen flex flex-col justify-center px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold flex items-center">
            <FaCalendarAlt className="text-blue-500 mr-3" />
            Manage Events
          </h2>
          <Link
            to="/event-list"
            className="text-blue-500 hover:underline font-medium"
          >
            View All Events
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg border border-gray-200 transition-transform hover:-translate-y-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Basketball Practice
            </h3>
            <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all">
              Manage Event
            </button>
          </div>
        </div>
      </section>

      <section ref={notificationRef} className="h-screen flex flex-col justify-center px-8">
        <h2 className="text-3xl font-bold mb-8 flex items-center">
          <FaBell className="text-yellow-500 mr-3" />
          Notifications
        </h2>
        <div className="space-y-6">
          <div className="p-5 bg-blue-50 border border-blue-100 rounded-lg shadow-md hover:shadow-lg">
            <div className="flex justify-between items-center">
              <p className="text-gray-800">New society created: Debate Society</p>
              <button className="text-sm text-blue-500 hover:underline">Mark as Read</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}