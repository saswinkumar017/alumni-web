export type AppEvent =
  | { readonly type: "USER_REGISTERED"; readonly payload: { userId: string } }
  | { readonly type: "EVENT_CREATED"; readonly payload: { eventId: string } }
  | { readonly type: "MESSAGE_SENT"; readonly payload: { conversationId: string } }
  | { readonly type: "JOB_APPLIED"; readonly payload: { jobId: string } }
  | { readonly type: "PROFILE_UPDATED"; readonly payload: { userId: string } };
