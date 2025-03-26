import { jsx as _jsx } from "react/jsx-runtime";
import CircularLoader from "./circular-loader";
export function LoadingView() {
    return (_jsx("div", { className: "flex justify-center items-center w-screen h-screen", children: _jsx(CircularLoader, {}) }));
}
