import { initDatabase } from "./db.js";
import { ICommandLog, IBizPost, IUserCreationAttributes } from "../common/types.js";
import { createUser } from "../services/userService.js";
import { createCommandLog } from "../services/commandLogsService.js";
import { createPost } from "../services/bizPostService.js";
import { createGweiRequest, getGweiRequests, updateStatusGweiRequests } from "../services/gweiRequestService.js";

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

  // const posts = await getPosts(1690000000);
  // console.log(posts);

  await createGweiRequest({
    value: 10,
    userId: "SampleUser123456789",
    channelId: "123456789",
    usersToNotify: ["user1", "user2"],
    active: true,
  });

  const gweiRequests = await getGweiRequests();
  console.log(gweiRequests);

  console.log(await updateStatusGweiRequests([1, 2, 3]));
  console.log(await getGweiRequests());
}

main().catch(console.error);
