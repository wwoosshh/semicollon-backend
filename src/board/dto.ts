export interface CreatePostDto {
  spaceId?: string | null;
  title: string;
  body?: string;
}
export interface CreateCommentDto {
  body: string;
}
