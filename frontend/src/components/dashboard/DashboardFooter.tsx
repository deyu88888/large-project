import { Box, Container, Grid2 as Grid } from "@mui/material";

export const DashboardFooter = () => {
  return (
    <Box
      sx={{
        backgroundColor: "secondary.main",
        height: 300,
      }}
    >
      <Container maxWidth={"xl"}>
        <Grid container>
          <Grid>item 1</Grid>
        </Grid>
      </Container>
    </Box>
  );
};
