import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth-store";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { apiClient, apiPaths } from "../api";
import * as Yup from "yup";

const validationSchema = Yup.object().shape({
  first_name: Yup.string()
    .required("First name is required.")
    .matches(
      /^[A-Za-z]+$/,
      "Shouldn't contain numerical or special characters."
    )
    .max(50, "First name is too long."),
  last_name: Yup.string()
    .required("Last name is required.")
    .matches(
      /^[A-Za-z]+$/,
      "Shouldn't contain numerical or special characters."
    )
    .max(50, "Last name is too long."),
  email: Yup.string()
    .matches(
      // checking email string with regular expression
      /^[A-Z0-9._+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      "Invalid email address."
    )
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
      <div className="container p-4">
        <button className="btn bg-slate-400 mx-auto px-4 py-2" onClick={goBack}>
          back
        </button>

        <p>No user found</p>
      </div>
    );
  }

  // TODO: add conditional rendering for student, based on whether they are presidents or not, after the models are updated
  return (
    <div className="container p-4">
      <button className="btn bg-slate-400 mx-auto px-4 py-2" onClick={goBack}>
        back
      </button>

      <div>
        <h1 className="text-2xl">Profile</h1>
        <div>username: {user.username}</div>
        <div>role: {user.role}</div>
        <Formik
          initialValues={{
            first_name: user?.firstName,

            last_name: user.lastName,
            username: user.username,
            email: user.email,
            role: user.role,
          }}
          validationSchema={validationSchema} // validating the form
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
          <Form>
            <div>
              <label htmlFor="first_name">First Name: </label>
              <Field name="first_name" type="text" />
              <ErrorMessage
                name="first_name"
                component="div"
                data-testid="error-first-name"
              />
            </div>

            <div>
              <label htmlFor="last_name">Last Name</label>
              <Field name="last_name" type="text" />
              <ErrorMessage
                name="last_name"
                component="div"
                data-testid="error-last-name"
              />
            </div>

            <div>
              <label htmlFor="email">Email</label>
              <Field name="email" type="email" />
              <button type="submit">Update</button>
              <ErrorMessage
                name="email"
                component="div"
                data-testid="error-email"
              />
            </div>
          </Form>
        </Formik>
        <div>verified: {user.isActive ? "true" : "false"}</div>
      </div>
    </div>
  );
}
