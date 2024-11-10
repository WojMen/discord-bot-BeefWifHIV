export interface Thread extends Reply {
  last_replies?: Reply[];
}

export interface Reply {
  no: number;
  time: number;
  now: string;
  capcode?: string;
  name?: string;
  filename?: string;
  com?: string;
}

export interface Page {
  threads: Thread[];
}

export interface Config {
  biz: {
    keyWords: string[];
    blockedWords: string[];
    regexPatterns: Pattern[];
  };
}

export interface Pattern {
  regex: string;
  label: string;
}

export interface IBizPost {
  threadId: number;
  postId: number;
  time: string;
  timeUNIX: number;
  link: string;
  capcode: string;
  name: string;
  filename: string;
  comment: string;
  matchedKeyWords?: string[];
  matchedPatterns?: string[];
}

export type GweiThreshold = {
  value: number;
  user: string;
  channel: string;
  usersToNotify: string[];
  createdAt: Date;
  finishedAt: Date | undefined;
  active: boolean;
};

export interface IUser {
  name: string;
  username: string;
  description?: string;
  usage_count?: number;
}

export interface ICommandLog {
  name: string;
  channelId: string;
  userId: string;
  parameters: Record<string, any>;
  active: boolean;
}

export interface IGeneralAPI {
  type: number;
  response: any;
  value: any;
  error: string;
}
