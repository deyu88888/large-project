import { jsx as _jsx } from "react/jsx-runtime";
const Spinner = () => {
    return (_jsx("div", { className: "flex justify-center items-center h-full", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500" }) }));
};
export default Spinner;
