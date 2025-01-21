import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth-store";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { apiClient, apiPaths } from "../api";
import * as Yup from "yup";

const validationSchema = Yup.object().shape({
  first_name: Yup.string()
    .required("First name is required.")
    .matches(/^[A-Za-z]+$/, "Shouldn't contain numerical or special characters.")
    .max(50, "First name is too long."),
  last_name: Yup.string()
    .required("Last name is required.")
    .matches(/^[A-Za-z]+$/, "Shouldn't contain numerical or special characters.")
    .max(50, "Last name is too long."),
  email: Yup.string()
    .matches(/^[A-Z0-9._+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, "Invalid email address.")
    .required("Email is required.")
    .max(50, "too long email id.")
    .min(6, "too short email id."),
});

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  function goBack() {
    navigate(-1);
  }

  if (user === null) {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            className="group px-6 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-all shadow-sm hover:shadow-md"
            onClick={goBack}
          >
            <span className="inline-flex items-center">
              <span className="mr-2 group-hover:-translate-x-1 transition-transform duration-200">←</span>
              Back
            </span>
          </button>
          <div className="mt-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-600 rounded-full mb-4">
              <span className="text-2xl text-gray-300">?</span>
            </div>
            <p className="text-gray-300">No user found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          className="group px-6 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-all shadow-sm hover:shadow-md"
          onClick={goBack}
        >
          <span className="inline-flex items-center">
            <span className="mr-2 group-hover:-translate-x-1 transition-transform duration-200">←</span>
            Back
          </span>
        </button>

        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-8 py-8 bg-gray-800">
            <h1 className="text-3xl font-bold text-white">Welcome back, {user.firstName}!</h1>
            <p className="mt-2 text-gray-300">Manage your profile information below</p>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-8 border border-gray-200">
              <div className="bg-blue-100 p-4 rounded-lg shadow">
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Username</div>
                <div className="font-semibold text-gray-900">{user.username}</div>
              </div>
              <div className="bg-green-100 p-4 rounded-lg shadow">
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Role</div>
                <div className="font-semibold text-gray-900">{user.role}</div>
              </div>
              <div className="bg-purple-100 p-4 rounded-lg shadow">
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Status</div>
                <div className="inline-flex items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mr-2 ${user.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                  <span className="font-semibold text-gray-900">{user.isActive ? "Verified" : "Not Verified"}</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-sm text-gray-500">Profile Information</span>
              </div>
            </div>

            <Formik
              initialValues={{
                first_name: user?.firstName,
                last_name: user.lastName,
                username: user.username,
                email: user.email,
                role: user.role,
              }}
              validationSchema={validationSchema}
              onSubmit={async ({
                first_name,
                last_name,
                username,
                email,
                role,
              }) => {
                const res = await apiClient.put(apiPaths.USER.CURRENT, {
                  first_name: user.firstName == first_name ? undefined : first_name,
                  last_name: user.lastName == last_name ? undefined : last_name,
                  username: user.username == username ? undefined : username,
                  email: user.email == email ? undefined : email,
                  role: user.role == role ? undefined : role,
                });
                console.log(res);
              }}
            >
              <Form className="space-y-8 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <label
                      htmlFor="first_name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      First Name
                    </label>
                    <Field
                      name="first_name"
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-gray-800 hover:border-gray-400 transition-all duration-200 shadow-sm"
                    />
                    <ErrorMessage
                      name="first_name"
                      component="div"
                      className="mt-1.5 text-sm text-red-600 bg-red-50 px-3 py-1 rounded-md"
                      data-testid="error-first-name"
                    />
                  </div>

                  <div className="space-y-6">
                    <label
                      htmlFor="last_name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Last Name
                    </label>
                    <Field
                      name="last_name"
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-gray-800 hover:border-gray-400 transition-all duration-200 shadow-sm"
                    />
                    <ErrorMessage
                      name="last_name"
                      component="div"
                      className="mt-1.5 text-sm text-red-600 bg-red-50 px-3 py-1 rounded-md"
                      data-testid="error-last-name"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <Field
                    name="email"
                    type="email"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-gray-800 hover:border-gray-400 transition-all duration-200 shadow-sm"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="mt-1.5 text-sm text-red-600 bg-red-50 px-3 py-1 rounded-md"
                    data-testid="error-email"
                  />
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                  >
                    Update Profile
                  </button>
                </div>
              </Form>
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
}