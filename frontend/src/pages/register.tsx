import { apiClient, apiPaths } from "../api";
import { useNavigate } from "react-router-dom";
import CircularLoader from "../components/loading/circular-loader";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";


export default function RegisterPage() {
    const navigate = useNavigate();

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

    const handleSubmit = async (values: any, { setSubmitting, setFieldError }: any) => {
        try {
            const res = await apiClient.post(apiPaths.USER.REGISTER, values);
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
                    }}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                >
                    {({ isSubmitting }) => (
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
                                <ErrorMessage name="first_name" component="div" className="text-red-500 text-sm" />
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
                                <ErrorMessage name="last_name" component="div" className="text-red-500 text-sm" />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <Field
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <ErrorMessage name="email" component="div" className="text-red-500 text-sm" />
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
                                <ErrorMessage name="username" component="div" className="text-red-500 text-sm" />
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
                                <ErrorMessage name="password" component="div" className="text-red-500 text-sm" />
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
                                <ErrorMessage name="major" component="div" className="text-red-500 text-sm" />
                            </div>

                            {isSubmitting && (
                                <div className="flex justify-center mt-4">
                                    <CircularLoader />
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



// import { apiClient, apiPaths } from "../api";
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import CircularLoader from "../components/loading/circular-loader";

// export default function RegisterPage() {
//     const [firstName, setFirstName] = useState("");
//     const [lastName, setLastName] = useState("");
//     const [email, setEmail] = useState("");
//     const [username, setUsername] = useState("");
//     const [password, setPassword] = useState("");
//     const [major, setMajor] = useState("");
//     const [department, setDepartment] = useState("");
//     const [societies, setSocieties] = useState("");
//     const [loading, setLoading] = useState(false);
//     const navigate = useNavigate();

//     const handleSubmit = async (e: any) => {
//         e.preventDefault();
//         if (!firstName || !lastName || !email || !username || !password || !major) {
//             alert("All required fields must be filled out!");
//             return;
//         }
    
//         if (!email.includes("@")) {
//             alert("Please provide a valid email address!");
//             return;
//         }
    
//         setLoading(true);


//         try {
//             const res = await apiClient.post(apiPaths.USER.REGISTER, {
//                 first_name: firstName,
//                 last_name: lastName,
//                 email: email,
//         setLoading(true);
//         e.preventDefault();

//         try {
//             const res = await apiClient.post(apiPaths.USER.REGISTER, {
//                 username: username,
//                 password: password,
//                 major: major,
//                 department: department || null, // Optional
//                 societies: societies || null,  // Optional
//             });
//             console.log(res);

//             navigate("/login");
//         } catch (error) {
//             alert("Error during registration. Please try again.");
//         } finally {
//             setLoading(false);
//         }

//     };

//     return (
//         <div className="flex justify-center items-center min-h-screen bg-gray-100">
//             <form
//                 onSubmit={handleSubmit}
//                 className="w-full max-w-lg bg-white p-8 rounded-lg shadow-lg"
//             >
//                 <h1 className="text-2xl font-bold text-center mb-6 text-indigo-600">
//                     Register as a Student
//                 </h1>
//                 <div className="grid grid-cols-1 gap-6">
//                     {/* First Name */}
//                     <div>
//                         <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
//                             First Name
//                         </label>
//                         <input
//                             id="firstName"
//                             type="text"
//                             value={firstName}
//                             onChange={(e) => setFirstName(e.target.value)}
//                             placeholder="Enter your first name"
//                             className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//                             required
//                         />
//                     </div>
//                     {/* Last Name */}
//                     <div>
//                         <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
//                             Last Name
//                         </label>
//                         <input
//                             id="lastName"
//                             type="text"
//                             value={lastName}
//                             onChange={(e) => setLastName(e.target.value)}
//                             placeholder="Enter your last name"
//                             className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//                             required
//                         />
//                     </div>
//                     {/* Email */}
//                     <div>
//                         <label htmlFor="email" className="block text-sm font-medium text-gray-700">
//                             Email
//                         </label>
//                         <input
//                             id="email"
//                             type="email"
//                             value={email}
//                             onChange={(e) => setEmail(e.target.value)}
//                             placeholder="Enter your email"
//                             className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//                             required
//                         />
//                     </div>
//                     {/* Username */}
//                     <div>
//                         <label htmlFor="username" className="block text-sm font-medium text-gray-700">
//                             Username
//                         </label>
//                         <input
//                             id="username"
//                             type="text"
//                             value={username}
//                             onChange={(e) => setUsername(e.target.value)}
//                             placeholder="Enter your username"
//                             className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//                             required
//                         />
//                     </div>
//                     {/* Password */}
//                     <div>
//                         <label htmlFor="password" className="block text-sm font-medium text-gray-700">
//                             Password
//                         </label>
//                         <input
//                             id="password"
//                             type="password"
//                             value={password}
//                             onChange={(e) => setPassword(e.target.value)}
//                             placeholder="Enter your password"
//                             className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//                             required
//                         />
//                     </div>
//                     {/* Major */}
//                     <div>
//                         <label htmlFor="major" className="block text-sm font-medium text-gray-700">
//                             Major
//                         </label>
//                         <input
//                             id="major"
//                             type="text"
//                             value={major}
//                             onChange={(e) => setMajor(e.target.value)}
//                             placeholder="E.g., Computer Science"
//                             className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//                             required
//                         />
//                     </div>
//                     {/* Department */}
//                     <div>
//                         <label htmlFor="department" className="block text-sm font-medium text-gray-700">
//                             Department (optional, if advisor)
//                         </label>
//                         <input
//                             id="department"
//                             type="text"
//                             value={department}
//                             onChange={(e) => setDepartment(e.target.value)}
//                             placeholder="E.g., Computer Engineering"
//                             className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//                         />
//                     </div>
//                     {/* Societies */}
//                     <div>
//                         <label htmlFor="societies" className="block text-sm font-medium text-gray-700">
//                             Societies (optional, if advisor)
//                         </label>
//                         <input
//                             id="societies"
//                             type="text"
//                             value={societies}
//                             onChange={(e) => setSocieties(e.target.value)}
//                             placeholder="E.g., Chess Club, Robotics Club"
//                             className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//                         />
//                     </div>
//                 </div>
//                 {loading && (
//                     <div className="flex justify-center mt-4">
//                         <CircularLoader />
//                     </div>
//                 )}
//                 <button
//                     type="submit"
//                     className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-md shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 >
//                     Register
//                 </button>
//             </form>
//         </div>
//     );
    
//     };

//     return (
//         <form onSubmit={handleSubmit} className="form-container">
//             <h1>Register as a Student</h1>
//             <input
//                 type="text"
//                 value={username}
//                 onChange={(e) => setUsername(e.target.value)}
//                 placeholder="Username"
//                 required
//             />
//             <input
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 placeholder="Password"
//                 required
//             />
//             <input
//                 type="text"
//                 value={major}
//                 onChange={(e) => setMajor(e.target.value)}
//                 placeholder="Major (e.g., Computer Science)"
//                 required
//             />
//             <input
//                 type="text"
//                 value={department}
//                 onChange={(e) => setDepartment(e.target.value)}
//                 placeholder="Department (optional, if advisor)"
//             />
//             <input
//                 type="text"
//                 value={societies}
//                 onChange={(e) => setSocieties(e.target.value)}
//                 placeholder="Societies (optional, if advisor)"
//             />
//             {loading && <CircularLoader />}
//             <button type="submit">Register</button>
//         </form>
//     );
// }
