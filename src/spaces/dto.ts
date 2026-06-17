export type SpaceType = "프로젝트" | "세미나" | "코딩대회" | "해커톤";
export type SpaceStatus = "제안중" | "모집중" | "진행중" | "완료" | "보관";

export interface CreateSpaceDto {
  type: SpaceType;
  title: string;
  description?: string;
}
export interface UpdateSpaceDto {
  title?: string;
  description?: string;
  type?: SpaceType;
  status?: SpaceStatus;
}
