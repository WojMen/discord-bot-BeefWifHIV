import logger from "../common/logger.js";
import { User } from "../database/models/user.js";
import { IUser } from "../common/types.js";

export async function createUser(user: IUser): Promise<void> {
  try {
    const existingUser = await User.findOne({ where: { name: user.name } });
    if (existingUser) {
      console.log(`User with name "${user.name}" already exists.`);
      return;
    }
    const newUser = await User.create(user);

    console.log("User created:", newUser.toJSON());
  } catch (error) {
    logger.error("Error creating user:", error);
  }
}
