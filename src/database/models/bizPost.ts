import { DataTypes, Model } from "sequelize";
import { IBizPost } from "../../common/types.js";
import { sequelize } from "../db.js";

export class BizPost extends Model<IBizPost> implements IBizPost {
  declare threadId: number;
  declare postId: number;
  declare time: string;
  declare timeUNIX: number;
  declare link: string;
  declare capcode: string;
  declare name: string;
  declare filename: string;
  declare comment: string;
  declare matchedKeyWords: string[];
  declare matchedPatterns: string[];
}

BizPost.init(
  {
    threadId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timeUNIX: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    capcode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    matchedKeyWords: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    matchedPatterns: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Post",
    tableName: "posts",
  }
);
