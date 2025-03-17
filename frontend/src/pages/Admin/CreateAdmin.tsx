// TODO: not giving the 'correct' error message to the user, make it dynamic, 
// should tell the user what type of error they're facing. i.e. missing special character in password

import { Box, Button, TextField } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../components/Header";
import { useState } from "react";
import CircularLoader from "../../components/loading/circular-loader";
import { apiClient, apiPaths } from "../../api";
import { useSettingsStore } from "../../stores/settings-store";
import { useAuthStore } from "../../stores/auth-store";


const Form = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { drawer } = useSettingsStore();
  const { user } = useAuthStore();
  console.log("yyy", { user });

  if (user?.is_super_admin) {
    const handleFormSubmit = async (values: any) => {
      setLoading(true);
      try {
        console.log(values);
        const res = await apiClient.post(apiPaths.USER.ADMIN, values);
        const { password, ...adminWithoutPassword } = res.data;
        setIsSuccess(true);
      } catch (error) {
        alert(error);
      } finally {
        setLoading(false);
      }
    };

    if (isSuccess) {
      return (
        <Box m="20px" display={"flex"} justifyContent={"center"} flexDirection={"column"} alignItems={"center"}>
          <Header title="CREATE ADMIN" subtitle="New Admin Created Successfully!" />

          <Button
            variant="contained"
            color="secondary"
            onClick={() => setIsSuccess(false)}
          >
            Create Another Admin
          </Button>
        </Box>
      );
    }

    return (
      <Box m="20px" justifyContent={"center"}
        sx={{
          height: "calc(100vh - 64px)",
          maxWidth: drawer ? `calc(100% - 3px)` : "100%",
        }}>
        <Header title="CREATE ADMIN" subtitle="Create a New Admin Profile" />

        <Formik
          onSubmit={handleFormSubmit}
          initialValues={initialValues}
          validationSchema={checkoutSchema}
        >
          {({
            values,
            errors,
            touched,
            handleBlur,
            handleChange,
            handleSubmit,
          }) => (
            <form onSubmit={handleSubmit}>
              <Box
                display="grid"
                gap="30px"
                gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                sx={{
                  "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                }}
              >
                <TextField
                  fullWidth
                  variant="filled"
                  type="text"
                  label="First Name"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.firstName}
                  name="firstName"
                  error={!!touched.firstName && !!errors.firstName}
                  helperText={touched.firstName && errors.firstName}
                  sx={{ gridColumn: "span 2" }}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  type="text"
                  label="Last Name"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.lastName}
                  name="lastName"
                  error={!!touched.lastName && !!errors.lastName}
                  helperText={touched.lastName && errors.lastName}
                  sx={{ gridColumn: "span 2" }}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  type="text"
                  label="Username"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.username}
                  name="username"
                  error={!!touched.username && !!errors.username}
                  helperText={touched.username && errors.username}
                  sx={{ gridColumn: "span 4" }}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  type="text"
                  label="Email"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.email}
                  name="email"
                  error={!!touched.email && !!errors.email}
                  helperText={touched.email && errors.email}
                  sx={{ gridColumn: "span 4" }}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  type="password"
                  label="Password"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.password}
                  name="password"
                  error={!!touched.password && !!errors.password}
                  helperText={touched.password && errors.password}
                  sx={{ gridColumn: "span 4" }}
                />
              </Box>
              {loading && (
                <Box display="flex" justifyContent="center" mt="20px">
                  <CircularLoader />
                </Box>
              )}
              <Box display="flex" justifyContent="end" mt="20px">
                <Button type="submit" color="secondary" variant="contained">
                  Create New Admin
                </Button>
              </Box>
            </form>
          )}
        </Formik>
      </Box>
    );
  } else {
    return (
      <Box m="20px" display={"flex"} justifyContent={"center"} flexDirection={"column"} alignItems={"center"}>
        <Header title="CREATE ADMIN" subtitle="You are not authorized to create an admin" />
      </Box>
    );
  }
}

const checkoutSchema = yup.object().shape({
  username: yup.string().required("required"),
  firstName: yup.string().required("required"),
  lastName: yup.string().required("required"),
  email: yup.string().email("invalid email").required("required"),
  password: yup.string().required("required"),
});

const initialValues = {
  username: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
};

export default Form;