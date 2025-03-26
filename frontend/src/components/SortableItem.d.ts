export type ExtraModuleType = "description" | "image" | "file" | "subtitle";
export interface ExtraModule {
    id: string;
    type: ExtraModuleType;
    textValue?: string;
    fileValue?: File | string;
}
interface SortableItemProps {
    mod: ExtraModule;
    onChangeText: (id: string, newValue: string) => void;
    onChangeFile: (id: string, file: File) => void;
    onDelete: (id: string) => void;
}
export declare function SortableItem({ mod, onChangeText, onChangeFile, onDelete }: SortableItemProps): import("react/jsx-runtime").JSX.Element;
export {};
