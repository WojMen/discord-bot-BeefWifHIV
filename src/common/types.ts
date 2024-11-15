import { CreationOptional } from "sequelize";

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

export type GweiThreshold = {
  value: number;
  user: string;
  channel: string;
  usersToNotify: string[];
  createdAt: Date;
  finishedAt: Date | undefined;
  active: boolean;
};

interface IBaseModel {
  id?: CreationOptional<number>;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
}

export interface IBizPost extends IBaseModel {
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

export type IUserCreationAttributes = Omit<IUser, "id" | "createdAt" | "updatedAt"> & {
  description?: string; // Ensures `description` defaults to `string`
};

export interface IUser extends IBaseModel {
  name: string;
  username: string;
  description?: string | null;
  usage_count?: number;
}

export interface ICommandLog extends IBaseModel {
  name: string;
  channelId: string;
  userId: string;
  parameters: Record<string, any>;
  active: boolean;
}

export interface IGeneralAPI extends IBaseModel {
  type: number;
  response: any;
  value: any;
  error: string;
}

export interface IGweiRequest extends IBaseModel {
  value: number;
  userId: string;
  channelId: string;
  usersToNotify?: string[] | null;
  active: boolean;
}
