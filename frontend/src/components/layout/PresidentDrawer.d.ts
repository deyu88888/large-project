import React from "react";
interface PresidentDrawerProps {
    drawer: boolean;
    toggleDrawer: () => void;
    location: {
        pathname: string;
    };
}
declare const PresidentDrawer: React.FC<PresidentDrawerProps>;
export default PresidentDrawer;
