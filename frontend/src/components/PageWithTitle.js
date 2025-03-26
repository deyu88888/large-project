import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from "react";
const PageWithTitle = ({ title, children }) => {
    useEffect(() => {
        document.title = title;
    }, [title]);
    return _jsx(_Fragment, { children: children });
};
export default PageWithTitle;
