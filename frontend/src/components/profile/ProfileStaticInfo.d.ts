import { User } from "../../types/user/user";
import { tokens } from "../../theme/theme";
interface ProfileStaticInfoProps {
    profile: User;
    colors: ReturnType<typeof tokens>;
}
export default function ProfileStaticInfo({ profile, colors }: ProfileStaticInfoProps): import("react/jsx-runtime").JSX.Element;
export {};
