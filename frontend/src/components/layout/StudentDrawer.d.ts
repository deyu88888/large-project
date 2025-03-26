import React from "react";
interface StudentDrawerProps {
    drawer: boolean;
    toggleDrawer: () => void;
    location: {
        pathname: string;
    };
}
declare const StudentDrawer: React.FC<StudentDrawerProps>;
export default StudentDrawer;
