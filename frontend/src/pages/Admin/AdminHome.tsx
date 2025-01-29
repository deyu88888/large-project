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
            <button className="hover:bg-gray-300 rounded-md hover:text-slate-900 p-2 transition duration-300 ease-in-out" onClick={() => scrollToSection(homeRef)}>
              Home
            </button>
            <button className="hover:bg-gray-300 rounded-md hover:text-slate-900 p-2 transition duration-300 ease-in-out" onClick={() => scrollToSection(userRef)}>
              Users
            </button>
            <button className="hover:bg-gray-300 rounded-md hover:text-slate-900 p-2 transition duration-300 ease-in-out" onClick={() => scrollToSection(societyRef)}>
              Societies
            </button>
            <button className="hover:bg-gray-300 rounded-md hover:text-slate-900 p-2 transition duration-300 ease-in-out" onClick={() => scrollToSection(eventRef)}>
              Events
            </button>
            <button className="hover:bg-gray-300 rounded-md hover:text-slate-900 p-2 transition duration-300 ease-in-out" onClick={() => scrollToSection(notificationRef)}>
              Notifications
            </button>
          </div>
          <button onClick={logout} className="px-4 py-2 bg-red-600 rounded-lg text-sm font-medium hover:bg-red-500 transition-all">
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

      <section ref={userRef} className="min-h-screen flex flex-col px-7 pt-[100px] pb-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold flex items-center">
            <FaUsers className="text-green-500 mr-3" />
            Manage Users
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
          <div className="p-6 bg-indigo-50 rounded-xl border border-gray-200 flex flex-col items-start h-full">
            <div className="flex items-center justify-between w-full mb-4">
              <h3 className="text-2xl font-semibold text-gray-900">Students</h3>
              <Link
                to="/student-list"
                className="text-blue-500 hover:underline font-medium"
              >
                Manage All Students
              </Link>
            </div>

            <div className="p-6 bg-white rounded-lg border border-gray-200 w-full">
              <h4 className="text-lg font-medium text-gray-800 mb-4">Student Requests</h4>

              <ul className="space-y-3">
                <li className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center shadow hover:shadow-md transition-transform hover:-translate-y-0">
                  <span className="text-sm text-gray-700">
                    Request 1: Report misuse of platform
                  </span>
                  <button className="text-red-500 text-sm font-medium hover:underline">
                    Resolve
                  </button>
                </li>
                <li className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center shadow hover:shadow-md transition-transform hover:-translate-y-0">
                  <span className="text-sm text-gray-700">
                    Request 2: Help with register
                  </span>
                  <button className="text-red-500 text-sm font-medium hover:underline">
                    Resolve
                  </button>
                </li>
                <li className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center shadow hover:shadow-md transition-transform hover:-translate-y-0">
                  <span className="text-sm text-gray-700">
                    Request 3: Reporting a bug in the system
                  </span>
                  <button className="text-red-500 text-sm font-medium hover:underline">
                    Resolve
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="p-6 bg-indigo-50 rounded-xl border border-gray-200 flex flex-col items-start h-full">
            <div className="flex items-center justify-between w-full mb-4">
              <h3 className="text-2xl font-semibold text-gray-900">Admins</h3>
              <Link
                to="/admin-list"
                className="text-blue-500 hover:underline font-medium"
              >
                Manage All Admins
              </Link>
            </div>
            <div className="p-6 bg-white rounded-lg border border-gray-200 w-full mb-4">
              <h4 className="text-lg font-medium text-gray-800 mb-4">Recent Activity Log</h4>
            </div>
            <div className="p-6 bg-white rounded-lg border border-gray-200 w-full mb-4">
              <h4 className="text-lg font-medium text-gray-800 mb-4">Messages</h4>
            </div>
            <div className="p-6 bg-white rounded-xl border border-gray-200 mb-4">
              <Link to="/create-admin">
                <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-transform hover:-translate-y-0 shadow hover:shadow-lg">
                  Create Admin
                </button>
              </Link>
            </div>
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