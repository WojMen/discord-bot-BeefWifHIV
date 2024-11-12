import { initDatabase } from "./db.js";
import { ICommandLog, IBizPost, IUser, IUserCreationAttributes } from "../common/types.js";
import { createUser } from "../services/userService.js";
import { createCommandLog } from "../services/commandLogsService.js";
import { createPost, getPosts } from "../services/bizPostService.js";

async function main() {
  await initDatabase();

  await createUser({
    name: "SampleUser",
    description: "A sample user description",
    username: "sampleuser123",
  } as IUserCreationAttributes);

  await createCommandLog({
    userId: "1",
    name: "monitorChannel",
    channelId: "123456789",
    parameters: { seconds: 412, interval: 300000 },
    active: true,
  } as ICommandLog);

  await createPost({
    threadId: 12345,
    postId: 1,
    time: "2024-11-08T12:00:00Z",
    timeUNIX: 1700000000,
    link: "https://example.com/thread/12345/post/1",
    capcode: "Mod",
    name: "John Doe",
    filename: "image.jpg",
    comment: "This is a test comment.",
    matchedKeyWords: ["test", "example"],
    matchedPatterns: ["pattern1", "pattern2"],
  } as IBizPost);

  const posts = await getPosts(1690000000);
  console.log(posts);
}

main().catch(console.error);
