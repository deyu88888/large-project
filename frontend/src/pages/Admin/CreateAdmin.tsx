import { apiClient, apiPaths } from "../../api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CircularLoader from "../../components/loading/circular-loader";
import { useFormik } from "formik";

export default function CreateAdmin() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  function goBack() {
    navigate(-1);
  }
  const createAminFormik = useFormik({
    initialValues: {
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
    onSubmit: async (data) => {
      setLoading(true);
      try {
        const res = await apiClient.post(apiPaths.USER.ADMIN, data);
        // navigate("/home");
      } catch (error) {
        alert(error);
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="relative min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <button
        className="group px-6 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-all shadow-sm hover:shadow-md absolute top-4 right-4"
        onClick={goBack}
      >
        <span className="inline-flex items-center">
          <span className="mr-2 group-hover:-translate-x-1 transition-transform duration-200">←</span>
          Back
        </span>
      </button>

      <div className="w-full max-w-md">
        <form
          onSubmit={createAminFormik.handleSubmit}
          className="bg-white p-6 rounded-lg shadow-lg overflow-auto"
        >
          <h1 className="text-2xl font-bold text-center mb-6">Create A New Admin</h1>
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={createAminFormik.values.username}
              onChange={createAminFormik.handleChange}
              placeholder="Enter your username"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700"
            >
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={createAminFormik.values.firstName}
              onChange={createAminFormik.handleChange}
              placeholder="Enter your first name"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700"
            >
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={createAminFormik.values.lastName}
              onChange={createAminFormik.handleChange}
              placeholder="Enter your last name"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              E-mail
            </label>
            <input
              id="email"
              type="text"
              value={createAminFormik.values.email}
              onChange={createAminFormik.handleChange}
              placeholder="Enter your e-mail"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={createAminFormik.values.password}
              onChange={createAminFormik.handleChange}
              placeholder="Enter your password"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {loading && (
            <div className="flex justify-center mb-4">
              <CircularLoader />
            </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md shadow hover:bg-indigo-700"
          >
            Create a New Admin
          </button>
        </form>
      </div>
    </div>
  );
}