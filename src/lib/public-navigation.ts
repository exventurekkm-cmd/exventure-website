export const activityRowId = (slug: string) => `activity-${slug}`;
export const activityListHref = (slug: string) => `/activities#${activityRowId(slug)}`;
export const historyRecordId = (date: string) => `history-${date.replace(".", "-")}`;
export const historyRecordHref = (date: string) => `/about#${historyRecordId(date)}`;
