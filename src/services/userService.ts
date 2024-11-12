import logger from "../common/logger.js";
import { User } from "../database/models/user.js";
import { IUserCreationAttributes } from "../common/types.js";

export async function createUser(user: IUserCreationAttributes): Promise<void> {
  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ where: { name: user.name } });
    if (existingUser) {
      console.log(`User with name "${user.name}" already exists.`);
      return;
    }

    // Create the new user
    const newUser = await User.create(user);

    console.log("User created:", newUser.toJSON());
  } catch (error) {
    logger.error("Error creating user:", error);
  }
}
