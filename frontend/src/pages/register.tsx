import { apiClient, apiPaths } from "../api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CircularLoader from "../components/loading/circular-loader";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";


export default function RegisterPage() {
    const navigate = useNavigate();
    const [otpSent, setOtpSent] = useState(false);
    const [email, setEmail] = useState("");

    // Validation schema using Yup
    const validationSchema = Yup.object({
        first_name: Yup.string()
            .max(50, "First name must be at most 50 characters")
            .required("First name is required"),
        last_name: Yup.string()
            .max(50, "Last name must be at most 50 characters")
            .required("Last name is required"),
        email: Yup.string()
            .email("Invalid email address")
            .required("Email is required"),
        username: Yup.string()
            .min(6, "Username must be at least 6 characters")
            .max(30, "Username must be at most 30 characters")
            .matches(
                /^[a-zA-Z0-9_.-]+$/,
                "Username must only contain letters, numbers, underscores, hyphens, and dots"
            )
            .required("Username is required"),
        password: Yup.string()
            .min(8, "Password must be at least 8 characters")
            .required("Password is required"),
        major: Yup.string()
            .max(50, "Major must be at most 50 characters")
            .required("Major is required"),
    });

    const handleRequestOTP = async (email: string, setFieldError: any) => {
        try {
            const res = await apiClient.post(apiPaths.USER.REQUEST_OTP, { email });
            console.log(res);
            setOtpSent(true);
            setEmail(email);
            alert("OTP has been sent to your email.");
        } catch (error: any) {
            if (error.response?.data?.error) {
                setFieldError("email", error.response.data.error);
            } else {
                alert("Error sending OTP. Please try again.");
            }
        }
    };

    const handleSubmit = async (values: any, { setSubmitting, setFieldError }: any) => {
        if (values.email !== email) {
            setFieldError("email", "Email must match the one used for OTP.");
            return;
        }

        try {
            const res = await apiClient.post(apiPaths.USER.REGISTER, {
                ...values,
                societies: [],
                president_of: [],
            });
            console.log(res);
            navigate("/login");
        } catch (error: any) {
            if (error.response?.data?.email) {
                setFieldError("email", error.response.data.email[0]);
            } else if (error.response?.data?.username) {
                setFieldError("username", error.response.data.username[0]);
            } else {
                alert("Error during registration. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="w-full max-w-lg bg-white p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-center mb-6 text-indigo-600">
                    Register as a Student
                </h1>
                <Formik
                    initialValues={{
                        first_name: "",
                        last_name: "",
                        email: "",
                        username: "",
                        password: "",
                        major: "",
                        otp: "",
                    }}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                >
                    {({ isSubmitting, setFieldError, values }) => (
                        <Form className="grid grid-cols-1 gap-6">
                            <div>
                                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                                    First Name
                                </label>
                                <Field
                                    id="first_name"
                                    name="first_name"
                                    type="text"
                                    placeholder="Enter your first name"
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <ErrorMessage name="first_name" component="div" className="text-red-500 text-sm"/>
                            </div>

                            <div>
                                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                                    Last Name
                                </label>
                                <Field
                                    id="last_name"
                                    name="last_name"
                                    type="text"
                                    placeholder="Enter your last name"
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <ErrorMessage name="last_name" component="div" className="text-red-500 text-sm"/>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <div className="flex">
                                    <Field
                                        id="email"
                                        name="email"
                                        type="email"
                                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <button
                                        type="button"
                                        className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md"
                                        disabled={otpSent}
                                        onClick={() => handleRequestOTP(values.email, setFieldError)}
                                    >
                                        {otpSent ? "OTP Sent" : "Get OTP"}
                                    </button>
                                </div>
                                <ErrorMessage name="email" component="div" className="text-red-500 text-sm"/>
                            </div>
                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                                    OTP Code
                                </label>
                                <Field
                                    id="otp"
                                    name="otp"
                                    type="text"
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <ErrorMessage name="otp" component="div" className="text-red-500 text-sm"/>
                            </div>


                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                    Username
                                </label>
                                <Field
                                    id="username"
                                    name="username"
                                    type="text"
                                    placeholder="Enter your username"
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <ErrorMessage name="username" component="div" className="text-red-500 text-sm"/>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <Field
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <ErrorMessage name="password" component="div" className="text-red-500 text-sm"/>
                            </div>

                            <div>
                                <label htmlFor="major" className="block text-sm font-medium text-gray-700">
                                    Major
                                </label>
                                <Field
                                    id="major"
                                    name="major"
                                    type="text"
                                    placeholder="E.g., Computer Science"
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <ErrorMessage name="major" component="div" className="text-red-500 text-sm"/>
                            </div>

                            {isSubmitting && (
                                <div className="flex justify-center mt-4">
                                    <CircularLoader/>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-md shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                Register
                            </button>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
}

