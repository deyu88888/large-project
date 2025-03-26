import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Container, Typography, Accordion, AccordionSummary, AccordionDetails, TextField, FormControl, InputLabel, Select, MenuItem, Button, Paper, Divider, Link, useTheme, Snackbar, Alert } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EmailIcon from "@mui/icons-material/Email";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import { tokens } from "../theme/theme";
import axios from "axios";
const Support = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isLight = theme.palette.mode === "light";
    const [expanded, setExpanded] = useState(false);
    const [reportType, setReportType] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [subject, setSubject] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success"
    });
    const handleChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };
    const handleSnackbarClose = () => {
        setSnackbar({ ...snackbar, open: false });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const reportData = {
                report_type: reportType,
                email: email,
                subject: subject,
                details: message
            };
            await axios.post("/api/dashboard/public-report", reportData);
            setReportType("");
            setEmail("");
            setSubject("");
            setMessage("");
            setSnackbar({
                open: true,
                message: "Your report has been submitted successfully. We'll get back to you soon.",
                severity: "success"
            });
        }
        catch (error) {
            console.error("Error submitting report:", error);
            setSnackbar({
                open: true,
                message: "There was an error submitting your report. Please try again later.",
                severity: "error"
            });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const faqSections = [
        {
            title: "General Questions",
            questions: [
                {
                    question: "How do I join a society?",
                    answer: "To join a society, navigate to the society's page and click the \"Join\" button. You will need to complete registration with your student email to join any societies."
                },
                {
                    question: "Can I join multiple societies?",
                    answer: "Yes, you can join as many societies as you wish. Just be mindful of managing your time and commitments!"
                },
                {
                    question: "Is there a deadline to join societies?",
                    answer: "Most societies accept new members throughout the academic year, but some competitive societies may have application deadlines. Check individual society pages for specific information."
                }
            ]
        },
        {
            title: "Events & Activities",
            questions: [
                {
                    question: "How do I register for society events?",
                    answer: "You must be logged in. Navigate to the \"Events\" section, find the event you're interested in, and click \"RSVP.\""
                },
                {
                    question: "Are events only for society members?",
                    answer: "This varies by event. Some events are open to all students, while others are exclusive to society members. Event listings will specify eligibility."
                },
                {
                    question: "How can I find out about upcoming events?",
                    answer: "You can view all upcoming events on the \" All Events\" page, filter by society, or check the dashboard for highlighted events. You'll also receive notifications for events from societies you've joined."
                },
            ]
        },
        {
            title: "Account Management",
            questions: [
                {
                    question: "How do I create an account?",
                    answer: "Click \"Register\" in the top navigation, enter your student email and create a password. Verify your email to complete registration."
                },
                {
                    question: "How do I update my profile information?",
                    answer: "After logging in, click on your profile picture/icon and update your information."
                },
            ]
        },
        {
            title: "Society Leadership",
            questions: [
                {
                    question: "How can I start a new society?",
                    answer: "Visit the \"Start Society\" page to submit an application. You'll need to provide a society name, description. You will receive a notification once your application is reviewed."
                },
                {
                    question: "What responsibilities do society leaders have?",
                    answer: "Leaders manage membership, organise events, handle society finances, and ensure compliance with university regulations."
                },
                {
                    question: "How are society elections conducted?",
                    answer: "Most societies hold elections at the end of each academic year. The process varies by society but typically involves nominations and voting by members."
                },
                {
                    question: "How do I access society management tools?",
                    answer: "Society officers can access management tools by logging in and navigating to \"Society Management\" in their dashboard."
                }
            ]
        },
        {
            title: "Technical Support",
            questions: [
                {
                    question: "Who do I contact if I'm having website issues?",
                    answer: "Email infiniteloop@gmail.com or use the \"Contact Support\" form in the website footer."
                },
                {
                    question: "How do I report inappropriate content or behavior?",
                    answer: "Use the \"Report\" button available on all content pages, or contact the website administrators through the support form below."
                }
            ]
        }
    ];
    return (_jsx("div", { style: {
            minHeight: "100vh",
            backgroundColor: isLight ? "#fcfcfc" : "#141b2d",
            transition: "all 0.3s ease-in-out",
            paddingTop: "2rem",
            paddingBottom: "4rem",
        }, children: _jsxs(Container, { maxWidth: "lg", children: [_jsxs(Box, { mb: 5, textAlign: "center", children: [_jsx(Typography, { variant: "h2", component: "h1", sx: {
                                color: colors.grey[100],
                                fontWeight: 700,
                                marginBottom: "1rem"
                            }, children: "Support Centre" }), _jsx(Typography, { variant: "h5", sx: {
                                color: colors.grey[200],
                                maxWidth: "700px",
                                margin: "0 auto"
                            }, children: "Find answers to frequently asked questions or reach out to our support team for assistance." })] }), _jsxs(Box, { mb: 8, children: [_jsx(Typography, { variant: "h3", sx: {
                                color: colors.grey[100],
                                marginBottom: "1.5rem",
                                paddingBottom: "0.5rem",
                                borderBottom: `1px solid ${isLight ? colors.grey[300] : colors.grey[700]}`
                            }, children: "Frequently Asked Questions" }), faqSections.map((section, sectionIndex) => (_jsxs(Box, { mb: 4, children: [_jsx(Typography, { variant: "h4", sx: {
                                        color: colors.grey[100],
                                        fontSize: "1.5rem",
                                        marginBottom: "1rem"
                                    }, children: section.title }), section.questions.map((faq, faqIndex) => (_jsxs(Accordion, { expanded: expanded === `panel-${sectionIndex}-${faqIndex}`, onChange: handleChange(`panel-${sectionIndex}-${faqIndex}`), sx: {
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
                                    }, children: [_jsx(AccordionSummary, { expandIcon: _jsx(ExpandMoreIcon, { sx: { color: colors.blueAccent[400] } }), "aria-controls": `panel-${sectionIndex}-${faqIndex}-content`, id: `panel-${sectionIndex}-${faqIndex}-header`, sx: {
                                                borderRadius: "8px",
                                                '&.Mui-expanded': {
                                                    borderRadius: "8px 8px 0 0",
                                                }
                                            }, children: _jsx(Typography, { sx: { fontWeight: 600 }, children: faq.question }) }), _jsx(AccordionDetails, { sx: { paddingTop: 0 }, children: _jsx(Typography, { sx: { color: colors.grey[200] }, children: faq.answer }) })] }, `faq-${sectionIndex}-${faqIndex}`)))] }, `section-${sectionIndex}`)))] }), _jsxs(Paper, { elevation: 3, sx: {
                        borderRadius: "12px",
                        overflow: "hidden",
                        backgroundColor: isLight ? colors.primary[400] : colors.primary[700],
                        border: `1px solid ${isLight ? colors.grey[300] : colors.grey[800]}`,
                    }, children: [_jsxs(Box, { p: 3, children: [_jsxs(Box, { display: "flex", alignItems: "center", mb: 3, children: [_jsx(ReportProblemIcon, { sx: { color: colors.blueAccent[400], marginRight: "10px", fontSize: "2rem" } }), _jsx(Typography, { variant: "h3", sx: {
                                                color: colors.grey[100],
                                                fontWeight: 600
                                            }, children: "Report an Issue" })] }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsx(Box, { mb: 3, children: _jsxs(FormControl, { fullWidth: true, required: true, variant: "outlined", children: [_jsx(InputLabel, { id: "report-type-label", children: "Report Type" }), _jsxs(Select, { labelId: "report-type-label", value: reportType, onChange: (e) => setReportType(e.target.value), label: "Report Type", sx: {
                                                            backgroundColor: isLight ? colors.primary[900] : colors.primary[600],
                                                        }, disabled: isSubmitting, children: [_jsx(MenuItem, { value: "Query", children: "Query" }), _jsx(MenuItem, { value: "Feedback", children: "Feedback" }), _jsx(MenuItem, { value: "Misconduct", children: "Misconduct" }), _jsx(MenuItem, { value: "System_issue", children: "System Issue" }), _jsx(MenuItem, { value: "Inappropriate", children: "Inappropriate Content" }), _jsx(MenuItem, { value: "Other", children: "Other" })] })] }) }), _jsx(Box, { mb: 3, children: _jsx(TextField, { fullWidth: true, label: "Your Email", type: "email", variant: "outlined", value: email, onChange: (e) => setEmail(e.target.value), required: true, sx: {
                                                    backgroundColor: isLight ? colors.primary[900] : colors.primary[600],
                                                }, disabled: isSubmitting }) }), _jsx(Box, { mb: 3, children: _jsx(TextField, { fullWidth: true, label: "Subject", type: "subject", variant: "outlined", value: subject, onChange: (e) => setSubject(e.target.value), required: true, sx: {
                                                    backgroundColor: isLight ? colors.primary[900] : colors.primary[600],
                                                }, disabled: isSubmitting }) }), _jsx(Box, { mb: 4, children: _jsx(TextField, { fullWidth: true, label: "Describe your issue here.", multiline: true, rows: 4, variant: "outlined", value: message, onChange: (e) => setMessage(e.target.value), required: true, sx: {
                                                    backgroundColor: isLight ? colors.primary[900] : colors.primary[600],
                                                }, disabled: isSubmitting }) }), _jsx(Box, { display: "flex", justifyContent: "flex-end", children: _jsx(Button, { type: "submit", variant: "contained", size: "large", disabled: isSubmitting, sx: {
                                                    backgroundColor: colors.greenAccent[600],
                                                    '&:hover': {
                                                        backgroundColor: colors.greenAccent[500],
                                                    },
                                                    fontWeight: 600,
                                                    padding: "10px 24px",
                                                }, children: isSubmitting ? "Submitting..." : "Submit Report" }) })] })] }), _jsx(Divider, {}), _jsxs(Box, { p: 3, sx: {
                                backgroundColor: isLight ?
                                    `rgba(${colors.primary[400].replace(/[^\d,]/g, '')}, 0.7)` :
                                    `rgba(${colors.primary[600].replace(/[^\d,]/g, '')}, 0.7)`
                            }, children: [_jsxs(Box, { display: "flex", alignItems: "center", mb: 2, children: [_jsx(EmailIcon, { sx: { color: colors.blueAccent[400], marginRight: "10px" } }), _jsx(Typography, { variant: "h6", sx: { color: colors.grey[100] }, children: "Email Support Directly" })] }), _jsx(Typography, { sx: { color: colors.grey[200], marginBottom: "1rem" }, children: "For urgent matters or if you prefer email communication, reach out to us at:" }), _jsx(Link, { href: "mailto:infiniteloop@gmail.com", sx: {
                                        color: colors.greenAccent[400],
                                        fontWeight: 600,
                                        '&:hover': {
                                            color: colors.greenAccent[300],
                                        },
                                    }, children: "infiniteloop@gmail.com" })] })] }), _jsx(Snackbar, { open: snackbar.open, autoHideDuration: 6000, onClose: handleSnackbarClose, anchorOrigin: { vertical: 'bottom', horizontal: 'center' }, children: _jsx(Alert, { onClose: handleSnackbarClose, severity: snackbar.severity, sx: { width: '100%' }, children: snackbar.message }) })] }) }));
};
export default Support;
