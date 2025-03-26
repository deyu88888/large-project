import { tokens } from "../../theme/theme";
interface Award {
    id: number;
    award: {
        title: string;
        description: string;
        rank: "Gold" | "Silver" | "Bronze";
    };
}
interface AwardListProps {
    userId: number;
    awards: Award[];
    isSelf: boolean;
    colors: ReturnType<typeof tokens>;
}
export default function AwardList({ awards, isSelf, colors }: AwardListProps): import("react/jsx-runtime").JSX.Element;
export {};
