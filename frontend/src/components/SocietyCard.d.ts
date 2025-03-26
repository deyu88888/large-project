import React from "react";
import { Society } from "../types";
interface SocietyCardProps {
    society: Society;
    isLight: boolean;
    colors: {
        primary: Record<number, string>;
        grey: Record<number, string>;
        blueAccent: Record<number, string>;
        greenAccent: Record<number, string>;
    };
    onViewSociety: (id: number) => void;
}
declare const SocietyCard: React.FC<SocietyCardProps>;
export default SocietyCard;
