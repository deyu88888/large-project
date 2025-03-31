import MuiAlert, { AlertProps } from "@mui/material/Alert";

interface CustomAlertProps extends AlertProps {}

export const Alert = ({ children, ...props }: CustomAlertProps) => {
  return (
    <MuiAlert elevation={6} variant="filled" {...props}>
      {children}
    </MuiAlert>
  );
};
