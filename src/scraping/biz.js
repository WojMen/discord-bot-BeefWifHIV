import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import { sleep } from "../common/time.js";

puppeteer.use(StealthPlugin());

async function scrapeWebsite() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto("https://boards.4chan.org/biz/");
    await page.waitForSelector("#delform > .board", { timeout: 5000 });

    const content = await page.evaluate(() => {
      const boardElement = document.querySelector("#delform > .board");
      if (!boardElement) return "Content not found";

      const threads = Array.from(boardElement.children).map((thread) => {
        console.log(thread);
        const posts = Array.from(thread.children).map((post) => {
          console.log(post);
          let postId = post.querySelector(".postMessage > a")?.innerText || "";
          const userId = post.querySelector(".posteruid > .hand")?.innerText || "";
          const dateTime = post.querySelector(".desktop > .dateTime")?.innerText || "";
          let postLink = post.querySelector(".postInfo > .postNum > a")?.getAttribute("href") || "";
          const postMessage = post.querySelector(".postMessage")?.textContent || "No message";

          postLink = postLink ? `https://boards.4chan.org${postLink}` : "";

          postId = postId ? post.querySelector(".postInfo > input")?.getAttribute("name") : "";

          return { postId, userId, dateTime, postLink, postMessage };
        });

        return { posts };
      });

      return { threads };
    });

    // console.log("Scraped Content:", content);

    lookThroughThreads(content);
  } catch (error) {
    console.error("Error during scraping:", error);
  }

  // Listen for 'd' keypress to close the browser
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on("data", async (key) => {
    if (key.toString() === "d") {
      console.log("Key 'd' pressed. Closing browser...");
      await browser.close();
      process.exit(); // Exit the program
    }
  });
}

scrapeWebsite();

const lookThroughThreads = async (board) => {
  const keywords = ["airdrop", "wallet", "address", "giveaway", "tme", "tdotme", "t me"];
  const blockPostId = ["45310862", "58462489"];

  const results = board.threads
    .map((thread) => {
      const matchingPosts = thread.posts
        .map((post) => {
          const matchedKeywords = keywords.filter((keyword) => post.postMessage.toLowerCase().includes(keyword));

          // Only return post if it has matched keywords
          return matchedKeywords.length > 0
            ? { ...post, matchedKeywords } // Add matched keywords to the post object
            : null;
        })
        .filter(Boolean);

      return matchingPosts.length > 0 ? { ...thread, posts: matchingPosts } : null;
    })
    .filter(Boolean)
    .map((thread) => {
      const filteredPosts = thread.posts.filter((post) => !blockPostId.includes(post.postId));

      return filteredPosts.length > 0 ? { ...thread, posts: filteredPosts } : null;
    })
    .filter(Boolean);

  console.log(results);
};
