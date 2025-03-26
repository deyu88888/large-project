import React from "react";
interface AdminDrawerProps {
    drawer: boolean;
    toggleDrawer: () => void;
    location: {
        pathname: string;
    };
}
declare const AdminDrawer: React.FC<AdminDrawerProps>;
export default AdminDrawer;
