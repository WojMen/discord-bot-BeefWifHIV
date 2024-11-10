import { Op } from "sequelize";
import logger from "../common/logger.js";
import { IBizPost } from "../common/types.js";
import { BizPost } from "../database/models/bizPost.js";

export const createPost = async (post: IBizPost) => {
  try {
    const newPost = await BizPost.create(post);
    console.log("Post added:", newPost.toJSON());
  } catch (error) {
    logger.error(`Error creating post: ${error}`);
  }
};

export const getPosts = async (timeUnix: number) => {
  try {
    const posts = await BizPost.findAll({
      where: {
        timeUNIX: { [Op.gt]: timeUnix },
      },
    });
    return posts;
  } catch (error) {
    logger.error(`Error getting posts: ${error}`);
  }
};
