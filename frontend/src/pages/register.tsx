import { apiClient, apiPaths } from "../api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CircularLoader from "../components/loading/circular-loader";

export default function RegisterPage() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [major, setMajor] = useState("");
    const [department, setDepartment] = useState("");
    const [societies, setSocieties] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: any) => {
        setLoading(true);
        e.preventDefault();
        console.log("Sending data:", { username, password, major, department, societies });


        try {
            const res = await apiClient.post(apiPaths.USER.REGISTER, {
                first_name: firstName,
                last_name: lastName,
                email: email,
                username: username,
                password: password,
                major: major,
                department: department || null, // Optional
                societies: societies || null,  // Optional
            });
            console.log(res);

            navigate("/login");
        } catch (error) {
            alert("Error during registration. Please try again.");
        } finally {
            setLoading(false);
        }

    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg"
            >
                <h1 className="text-2xl font-bold text-center mb-6">
                    Register as a Student
                </h1>
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
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
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
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
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
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    />
                </div>

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
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
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
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label
                        htmlFor="major"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Major
                    </label>
                    <input
                        id="major"
                        type="text"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        placeholder="E.g., Computer Science"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label
                        htmlFor="department"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Department (optional, if advisor)
                    </label>
                    <input
                        id="department"
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="E.g., Computer Engineering"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div className="mb-6">
                    <label
                        htmlFor="societies"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Societies (optional, if advisor)
                    </label>
                    <input
                        id="societies"
                        type="text"
                        value={societies}
                        onChange={(e) => setSocieties(e.target.value)}
                        placeholder="E.g., Chess Club, Robotics Club"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
                    Register
                </button>
            </form>
        </div>
    );
    
}

// import { apiClient, apiPaths } from "../api";
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import CircularLoader from "../components/loading/circular-loader";

// export default function RegisterPage() {
//     const [username, setUsername] = useState("");
//     const [password, setPassword] = useState("");
//     const [major, setMajor] = useState("");
//     const [department, setDepartment] = useState("");
//     const [societies, setSocieties] = useState("");
//     const [loading, setLoading] = useState(false);
//     const navigate = useNavigate();

//     const handleSubmit = async (e: any) => {
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
