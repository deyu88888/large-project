import React from "react";
interface SocietyDetailLayoutProps {
    society: any;
    loading: boolean;
    joined: number | boolean;
    onJoinSociety: (societyId: number) => void;
}
declare const SocietyDetailLayout: React.FC<SocietyDetailLayoutProps>;
export default SocietyDetailLayout;
