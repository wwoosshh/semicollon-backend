export type EventKind = "정기모임" | "세미나" | "발표" | "마감" | "행사" | "기타";
export type AttendanceStatus = "출석" | "지각" | "결석";

export interface CreateEventDto {
  spaceId?: string | null;
  title: string;
  startsAt: string;          // ISO
  endsAt?: string | null;    // ISO
  location?: string;
  kind: EventKind;
}
export interface UpdateEventDto {
  title?: string;
  startsAt?: string;
  endsAt?: string | null;
  location?: string;
  kind?: EventKind;
}
export interface SetAttendanceDto {
  status: AttendanceStatus;
}
