import { apiClient, apiPaths } from "../api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import CircularLoader from "../components/loading/circular-loader";
import { useFormik } from "formik";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loginFormik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    onSubmit: async (data) => {
      setLoading(true);
      try {
        console.log(data);
        const res = await apiClient.post(apiPaths.USER.LOGIN, data);
        console.log(res.data);
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
        navigate("/");
      } catch (error) {
        alert(error);
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <form
        onSubmit={loginFormik.handleSubmit}
        className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg overflow-auto"
      >
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
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
            value={loginFormik.values.username}
            onChange={loginFormik.handleChange}
            placeholder="Enter your username"
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
            value={loginFormik.values.password}
            onChange={loginFormik.handleChange}
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
          Login
        </button>
        <div className="mt-4 text-center">
          <p>
            Need to sign up?{" "}
            <a href="/register" className="text-indigo-600 hover:underline">
              Please register.
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
