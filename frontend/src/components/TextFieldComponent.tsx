import { TextField } from "@mui/material";
import React from "react";

interface Props {
  label: string;
  name: string;
  value: string;
  handleBlur: (e: React.FocusEvent<any>) => void;
  handleChange: (e: React.ChangeEvent<any>) => void;
  error: boolean;
  helperText?: string;
  gridSpan?: string;
  disabled?: boolean;
}

const TextFieldComponent: React.FC<Props> = ({
  label,
  name,
  value,
  handleBlur,
  handleChange,
  error,
  helperText,
  gridSpan,
  disabled
}) => {
  return (
    <TextField
      fullWidth
      variant="outlined"
      type="text"
      label={label}
      name={name}
      value={value}
      onBlur={handleBlur}
      onChange={handleChange}
      error={error}
      helperText={helperText}
      disabled={disabled}
      sx={{
        gridColumn: gridSpan || "span 4",
      }}
    />
  );
};

export default TextFieldComponent;