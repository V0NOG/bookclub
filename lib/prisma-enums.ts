export const FeedbackTargetType = {
  USER: "USER",
  BOOK: "BOOK",
  CLUB: "CLUB",
} as const;

export type FeedbackTargetType =
  (typeof FeedbackTargetType)[keyof typeof FeedbackTargetType];

export const FeedbackAction = {
  LIKE: "LIKE",
  DISLIKE: "DISLIKE",
} as const;

export type FeedbackAction = (typeof FeedbackAction)[keyof typeof FeedbackAction];

export const UserType = {
  READER: "READER",
  ORGANISER: "ORGANISER",
  MEMBER: "MEMBER",
  INFLUENCER: "INFLUENCER",
} as const;

export type UserType = (typeof UserType)[keyof typeof UserType];
