import React, { ReactNode, useState } from "react";
import { Box, Tabs, Tab, useTheme, Typography } from "@mui/material";
import { tokens } from "../../theme/theme";
import SocietyList from "./SocietyList";
import SocietyListRejected from "./RejectedSocietiesList";
import PendingSocietyRequest from "./SocietyCreationRequests";

const CustomTabPanel = ({ children, value, index }: { children: ReactNode, value: number, index: number }) => (
  value === index ? (
    <Box role="tabpanel">
      {children}
    </Box>
  ) : null
);

const tabs = [
  { label: "Approved", component: <SocietyList /> },
  { label: "Rejected", component: <SocietyListRejected /> },
  { label: "Pending", component: <PendingSocietyRequest /> },
];

const ManageSocieties = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [value, setValue] = useState<number>(() => {
    const savedTab = localStorage.getItem("activeTab");
    return savedTab ? parseInt(savedTab, 10) : 0;
  });

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    localStorage.setItem("activeTab", newValue.toString());
  };

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        backgroundColor: "primary", 
      }}
    >
      <Typography
        variant="h1"
        sx={[
          { color: colors.grey[100] },
          { fontSize: "1.75rem", fontWeight: 800, mb: 2 },
        ]}
      >
        Manage Societies
      </Typography>
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          color: "colors.grey[200]",
        }}
      >
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="society tabs"
          textColor="secondary"
          indicatorColor="secondary"
        >
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      {tabs.map((tab, index) => (
        <CustomTabPanel key={index} value={value} index={index}>
          {tab.component}
        </CustomTabPanel>
      ))}
    </Box>
  );
};

export default ManageSocieties;