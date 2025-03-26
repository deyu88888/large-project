import { jsxs as _jsxs, Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, } from "@mui/material";
const PreviewSection = ({ title, content }) => (_jsxs(Box, { mb: 2, children: [_jsxs(Typography, { variant: "subtitle2", children: [title, ":"] }), content] }));
const SocietyPreviewModal = ({ open, onClose, formData }) => {
    const renderSocialMediaLinks = () => (_jsx(_Fragment, { children: Object.entries(formData.social_media_links).map(([platform, link]) => (_jsxs(Typography, { variant: "body1", children: [platform, ": ", link] }, platform))) }));
    const renderIcon = () => {
        if (formData.icon && typeof formData.icon === "string") {
            return (_jsx("img", { src: formData.icon, alt: "Society icon", style: { maxWidth: "100%", height: "auto" } }));
        }
        return null;
    };
    return (_jsxs(Dialog, { open: open, onClose: onClose, fullWidth: true, maxWidth: "sm", children: [_jsx(DialogTitle, { children: "Society Preview" }), _jsxs(DialogContent, { dividers: true, children: [_jsx(PreviewSection, { title: "Name", content: _jsx(Typography, { variant: "body1", children: formData.name }) }), _jsx(PreviewSection, { title: "Category", content: _jsx(Typography, { variant: "body1", children: formData.category }) }), _jsx(PreviewSection, { title: "Membership Requirements", content: _jsx(Typography, { variant: "body1", children: formData.membership_requirements }) }), _jsx(PreviewSection, { title: "Upcoming Projects or Plans", content: _jsx(Typography, { variant: "body1", children: formData.upcoming_projects_or_plans }) }), _jsx(PreviewSection, { title: "Tags", content: _jsx(Typography, { variant: "body1", children: formData.tags.join(", ") }) }), _jsx(PreviewSection, { title: "Social Media Links", content: renderSocialMediaLinks() }), formData.icon && typeof formData.icon === "string" && (_jsx(PreviewSection, { title: "Icon", content: renderIcon() }))] }), _jsx(DialogActions, { children: _jsx(Button, { onClick: onClose, variant: "outlined", children: "Close Preview" }) })] }));
};
export default SocietyPreviewModal;
