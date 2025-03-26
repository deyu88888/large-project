interface ProfileUserProps {
    major?: string;
    isPresident?: boolean;
    isVicePresident?: boolean;
    isEventManager?: boolean;
    presidentOf?: number | null;
    vicePresidentOfSociety?: number | null;
    eventManagerOfSociety?: number | null;
}
export default function ProfileUserInfo({ major, isPresident, isVicePresident, isEventManager, presidentOf, vicePresidentOfSociety, eventManagerOfSociety, }: ProfileUserProps): import("react/jsx-runtime").JSX.Element | null;
export {};
