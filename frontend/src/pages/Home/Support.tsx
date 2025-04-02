import { useState } from "react";
import { 
  Box, 
  Container, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Divider,
  Link,
  useTheme,
  Snackbar,
  Alert
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EmailIcon from "@mui/icons-material/Email";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import { tokens } from "../../theme/theme";
import { apiClient } from "../../api";
import { faqSections } from "../../constants/faqSections";

const Support = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";
  const [expanded, setExpanded] = useState<string | false>(false);

  const [reportType, setReportType] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: "",
    severity: "success"
  });

  const handleChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const reportData = {
        report_type: reportType,
        email: email,
        subject: subject,
        details: message
      };
      await apiClient.post("/api/dashboard/public-report", reportData);      
      setReportType("");
      setEmail("");
      setSubject("");
      setMessage("");
      
      setSnackbar({
        open: true,
        message: "Your report has been submitted successfully. We'll get back to you soon.",
        severity: "success"
      });
    } catch (error) {
      console.error("Error submitting report:", error);
      
      setSnackbar({
        open: true,
        message: "There was an error submitting your report. Please try again later.",
        severity: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: isLight ? "#fcfcfc" : "#141b2d",
        transition: "all 0.3s ease-in-out",
        paddingTop: "2rem",
        paddingBottom: "4rem",
      }}
    >
      <Container maxWidth="lg">
        <Box mb={5} textAlign="center">
          <Typography 
            variant="h2" 
            component="h1"
            sx={{ 
              color: colors.grey[100],
              fontWeight: 700,
              marginBottom: "1rem"
            }}
          >
            Support Centre
          </Typography>
          <Typography 
            variant="h5"
            sx={{
              color: colors.grey[200],
              maxWidth: "700px",
              margin: "0 auto"
            }}
          >
            Find answers to frequently asked questions or reach out to our support team for assistance.
          </Typography>
        </Box>

        {/* FAQ Sections with Accordions */}
        <Box mb={8}>
          <Typography 
            variant="h3" 
            sx={{ 
              color: colors.grey[100],
              marginBottom: "1.5rem",
              paddingBottom: "0.5rem",
              borderBottom: `1px solid ${isLight ? colors.grey[300] : colors.grey[700]}`
            }}
          >
            Frequently Asked Questions
          </Typography>

          {faqSections.map((section, sectionIndex) => (
            <Box key={`section-${sectionIndex}`} mb={4}>
              <Typography 
                variant="h4" 
                sx={{ 
                  color: colors.grey[100],
                  fontSize: "1.5rem",
                  marginBottom: "1rem" 
                }}
              >
                {section.title}
              </Typography>
              
              {section.questions.map((faq, faqIndex) => (
                <Accordion 
                  key={`faq-${sectionIndex}-${faqIndex}`}
                  expanded={expanded === `panel-${sectionIndex}-${faqIndex}`} 
                  onChange={handleChange(`panel-${sectionIndex}-${faqIndex}`)}
                  sx={{
                    backgroundColor: isLight ? colors.primary[400] : colors.primary[700],
                    color: colors.grey[100],
                    marginBottom: "0.5rem",
                    borderRadius: expanded === `panel-${sectionIndex}-${faqIndex}` ? "8px" : "8px !important",
                    '&:before': {
                      display: 'none',
                    },
                    boxShadow: isLight
                      ? "0 4px 8px rgba(0, 0, 0, 0.05)"
                      : "0 4px 8px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: colors.blueAccent[400] }} />}
                    aria-controls={`panel-${sectionIndex}-${faqIndex}-content`}
                    id={`panel-${sectionIndex}-${faqIndex}-header`}
                    sx={{
                      borderRadius: "8px",
                      '&.Mui-expanded': {
                        borderRadius: "8px 8px 0 0",
                      }
                    }}
                  >
                    <Typography sx={{ fontWeight: 600 }}>{faq.question}</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ paddingTop: 0 }}>
                    <Typography sx={{ color: colors.grey[200] }}>
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ))}
        </Box>

        {/* Support Form */}
        <Paper 
          elevation={3} 
          sx={{ 
            borderRadius: "12px",
            overflow: "hidden",
            backgroundColor: isLight ? colors.primary[400] : colors.primary[700],
            border: `1px solid ${isLight ? colors.grey[300] : colors.grey[800]}`,
          }}
        >
          <Box p={3}>
            <Box display="flex" alignItems="center" mb={3}>
              <ReportProblemIcon sx={{ color: colors.blueAccent[400], marginRight: "10px", fontSize: "2rem" }} />
              <Typography 
                variant="h3" 
                sx={{ 
                  color: colors.grey[100],
                  fontWeight: 600
                }}
              >
                Report an Issue
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <Box mb={3}>
                <FormControl fullWidth required variant="outlined">
                  <InputLabel id="report-type-label">Report Type</InputLabel>
                  <Select
                    labelId="report-type-label"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    label="Report Type"
                    sx={{
                      backgroundColor: isLight ? colors.primary[900] : colors.primary[600],
                    }}
                    disabled={isSubmitting}
                  >
                    <MenuItem value="Query">Query</MenuItem>
                    <MenuItem value="Feedback">Feedback</MenuItem>
                    <MenuItem value="Misconduct">Misconduct</MenuItem>
                    <MenuItem value="System_issue">System Issue</MenuItem>
                    <MenuItem value="Inappropriate">Inappropriate Content</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box mb={3}>
                <TextField
                  fullWidth
                  label="Your Email"
                  type="email"
                  variant="outlined"
                  value={email}
                  onChange={(e:any) => setEmail(e.target.value)}
                  required
                  sx={{
                    backgroundColor: isLight ? colors.primary[900] : colors.primary[600],
                  }}
                  disabled={isSubmitting}
                />
              </Box>

              <Box mb={3}>
                <TextField
                  fullWidth
                  label="Subject"
                  type="subject"
                  variant="outlined"
                  value={subject}
                  onChange={(e:any) => setSubject(e.target.value)}
                  required
                  sx={{
                    backgroundColor: isLight ? colors.primary[900] : colors.primary[600],
                  }}
                  disabled={isSubmitting}
                />
              </Box>

              <Box mb={4}>
                <TextField
                  fullWidth
                  label="Describe your issue here."
                  multiline
                  rows={4}
                  variant="outlined"
                  value={message}
                  onChange={(e: any) => setMessage(e.target.value)}
                  required
                  sx={{
                    backgroundColor: isLight ? colors.primary[900] : colors.primary[600],
                  }}
                  disabled={isSubmitting}
                />
              </Box>

              <Box display="flex" justifyContent="flex-end">
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  sx={{
                    backgroundColor: colors.greenAccent[600],
                    '&:hover': {
                      backgroundColor: colors.greenAccent[500],
                    },
                    fontWeight: 600,
                    padding: "10px 24px",
                  }}
                >
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </Button>
              </Box>
            </form>
          </Box>

          <Divider />

          <Box 
            p={3} 
            sx={{ 
              backgroundColor: isLight ? 
                `rgba(${colors.primary[400].replace(/[^\d,]/g, '')}, 0.7)` : 
                `rgba(${colors.primary[600].replace(/[^\d,]/g, '')}, 0.7)` 
            }}
          >
            <Box display="flex" alignItems="center" mb={2}>
              <EmailIcon sx={{ color: colors.blueAccent[400], marginRight: "10px" }} />
              <Typography variant="h6" sx={{ color: colors.grey[100] }}>
                Email Support Directly
              </Typography>
            </Box>
            <Typography sx={{ color: colors.grey[200], marginBottom: "1rem" }}>
              For urgent matters or if you prefer email communication, reach out to us at:
            </Typography>
            <Link
              href="mailto:infiniteloop@gmail.com"
              sx={{
                color: colors.greenAccent[400],
                fontWeight: 600,
                '&:hover': {
                  color: colors.greenAccent[300],
                },
              }}
            >
              infiniteloop@gmail.com
            </Link>
          </Box>
        </Paper>

        {/* Snackbar for feedback */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleSnackbarClose} 
            severity={snackbar.severity} 
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </div>
  );
};

export default Support;