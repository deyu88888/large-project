interface CommentType {
    id: number;
    content: string;
    create_at: string;
    user_data: {
        id: number;
        username: string;
        icon?: string;
    };
    parent_comment: number | null;
    replies: CommentType[];
    likes: number;
    dislikes: number;
    liked_by_user: boolean;
    disliked_by_user: boolean;
}
interface Props {
    comment: CommentType;
    onReply: (parentId: number, content: string) => void;
    parentUsername?: string;
    parentUserId?: number;
}
export declare function CommentItem({ comment, onReply, parentUsername, parentUserId, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
