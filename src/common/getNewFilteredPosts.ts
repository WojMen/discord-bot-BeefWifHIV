import he from "he";
import { Config, Pattern, Post, Page, Thread, Reply } from "./types.js";
import fs from "fs-extra";
// Define interfaces for type safety

export const getNewFilteredPosts = async (timeUNIX: number): Promise<Post[]> => {
  console.log(timeUNIX);
  const catalog = await fetchCatalog();
  const allPosts: Post[] = await aggregatePosts(catalog, timeUNIX);
  const filteredPosts: Post[] = await filterPosts(allPosts);

  return filteredPosts;
};

const fetchCatalog = async (): Promise<Page[]> => {
  const response: any = await fetch("https://a.4cdn.org/biz/catalog.json");
  return await response.json();
};

function convertEasternToUTC(unixTimestamp: number): string {
  const date = new Date(unixTimestamp * 1000);

  const polandTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);

  return polandTime;
}

const aggregatePosts = async (catalog: any, minPostDate: number): Promise<Post[]> =>
  catalog.flatMap((page: Page) => {
    const posts = page.threads.flatMap((thread: Thread): Post[] => {
      const mainPost: Post = {
        threadId: thread.no,
        postId: thread.no,
        timeUNIX: thread.time,
        time: convertEasternToUTC(thread.time),
        link: `https://boards.4chan.org/biz/thread/${thread.no}`,
        capcode: thread.capcode || "",
        name: thread.name || "",
        filename: thread.filename ? he.decode(thread.filename) : "",
        comment: thread.com ? he.decode(thread.com) : "",
      };

      const replies: Post[] =
        thread.last_replies?.reduce((arr: Post[], reply: Reply) => {
          if (reply.time < minPostDate) return arr;

          arr.push({
            threadId: thread.no,
            postId: reply.no,
            timeUNIX: reply.time,
            time: convertEasternToUTC(reply.time),
            link: `https://boards.4chan.org/biz/thread/${thread.no}#p${reply.no}`,
            capcode: reply.capcode || "",
            name: reply.name || "",
            filename: reply.filename ? he.decode(reply.filename) : "",
            comment: reply.com ? he.decode(reply.com) : "",
          });

          return arr;
        }, []) || [];

      return [mainPost, ...replies];
    });

    const filterThreadPosts = posts.filter((post: Post) => post.timeUNIX > minPostDate);

    return filterThreadPosts;
  });

const CONFIG_FILE_PATH = "./config.json";

const filterPosts = async (posts: Post[]): Promise<Post[]> => {
  const config: Config = fs.readJsonSync(CONFIG_FILE_PATH);

  // Access the configuration values
  const keyWords = config.biz.keyWords;
  const patterns: Pattern[] = config.biz.regexPatterns;
  const blockedWords = config.biz.blockedWords;

  const filteredPosts = posts
    .map((post) => {
      post.comment = post.comment
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/\n{2,}/g, "\n")
        .replace(/<a[^>]*class="quotelink"[^>]*>(.*?)<\/a>/g, "$1")
        .replace(/<span[^>]*class="quote"[^>]*>(.*?)<\/span>/g, "$1");

      const texts = [post.filename, post.comment];

      // Check for blocked words
      if (blockedWords.some((word: string) => texts.some((text) => text.toLowerCase().includes(word)))) return null;

      // Check for key words
      const matchedKeyWords = texts.reduce((acc: string[], text: string) => {
        keyWords.forEach((word: string) => {
          if (text.toLowerCase().includes(word)) acc.push(word);
        });

        return acc;
      }, []);

      // Highlight matched key words and update post fields directly
      matchedKeyWords.forEach((pattern: string) => {
        const regex = new RegExp(`(?<!\\*)(${pattern})(?!\\*)`, "gi");

        post.filename = post.filename.replace(regex, "__**$1**__");
        post.comment = post.comment.replace(regex, "__**$1**__");
      });

      // // Check for regex patterns
      // const matchedPatterns = patterns
      //   .map(({ regex, label }) => {
      //     const regexT = new RegExp(regex, "g");

      //     const hasMatch = texts.some((text) => {
      //       const textMatches = text.toLowerCase().match(regexT) || [];
      //       return textMatches && textMatches.length > 0;
      //     });

      //     return hasMatch ? label : null;
      //   })
      //   .filter((label): label is string => label !== null);

      const matchedPatterns = patterns.reduce((acc: string[], { regex, label }) => {
        const regexT = new RegExp(regex, "g");

        texts.forEach((text) => {
          const textMatches = text.toLowerCase().match(regexT) || [];
          if (textMatches && textMatches.length > 0) acc.push(label);
        });

        return acc;
      }, []);

      // highlight matched patterns
      matchedPatterns.forEach((pattern) => {
        post.comment = highLightTokenAddress(post.comment, pattern);
        post.filename = highLightTokenAddress(post.filename, pattern);
      });

      return matchedKeyWords.length > 0 || matchedPatterns.length > 0
        ? { ...post, matchedKeyWords, matchedPatterns }
        : null;
    })
    .filter(Boolean);

  filteredPosts.sort((a, b) => (a && b ? a.timeUNIX - b.timeUNIX : 0));

  return (filteredPosts as Post[]) || [];
};

const highLightTokenAddress = (text: string, pattern: string): string => {
  if (text.length === 0) return text;

  const urlRegex = /https?:\/\/[^\s]+/g;

  // Replace URLs with a placeholder
  const urls: string[] = [];

  const textWithPlaceholders = text.replace(urlRegex, (url) => {
    urls.push(url);
    return "__URL_PLACEHOLDER__";
  });

  const patternRegex = new RegExp(`(?<!\\*)(${pattern})(?!\\*)`, "gi");

  text = textWithPlaceholders.replace(patternRegex, "__**$1**__");

  let urlIndex = 0;
  text = text.replace(/__URL_PLACEHOLDER__/g, () => urls[urlIndex++]);

  return text;
};

// Reading from file

// const oldFilteredPosts: Post[] = JSON.parse(await Deno.readTextFile("./src/data/biz.json")).posts.slice(-5);
// const transformedPosts: Post[] = oldFilteredPosts.map((post: any) => ({
//   threadId: 0, // Set a default or derive from other properties if available
//   postId: Number(post.postId), // Convert postId to number
//   time: post.dateTime,
//   timeUNIX: Number(post.dateUTC), // Convert dateUTC to number
//   link: post.postLink,
//   capcode: "", // Set to empty if unavailable
//   name: post.userId || "", // Use userId or empty if missing
//   filename: post.postFileText || "", // Use postFileText
//   comment: post.postMessage, // Use postMessage as comment
// }));
// const filteredPosts = await filterPosts(transformedPosts);

// getNewFilteredPosts(3500);
