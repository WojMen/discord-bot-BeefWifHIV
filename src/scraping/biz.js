import * as fs from "node:fs";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

async function scrapeWebsite() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto("https://boards.4chan.org/biz/");
    await page.waitForSelector("#delform > .board", { timeout: 10000 });

    const content = await page.evaluate(() => {
      const boardElement = document.querySelector("#delform > .board");
      if (!boardElement) return "Content not found";

      const threads = Array.from(boardElement.children).map((thread) => {
        console.log(thread);
        const posts = Array.from(thread.children).map((post) => {
          console.log(post);
          let postId = post.querySelector(".postInfo > input")?.getAttribute("name") || "";
          const userId = post.querySelector(".posteruid > .hand")?.innerText || "";
          const dateTime = post.querySelector(".desktop > .dateTime")?.innerText || "";
          const dateUTC = post.querySelector(".desktop > .dateTime")?.getAttribute("data-utc") || "";
          let postLink = post.querySelector(".postInfo > .postNum > a")?.getAttribute("href") || "";
          const postMessage = post.querySelector(".postMessage")?.textContent || "No message";
          const postFileText = post.querySelector(".post > .file > .fileText > a")?.innerText || "";

          postLink = postLink ? `https://boards.4chan.org/biz/${postLink}` : "";

          return { postId, userId, dateTime, dateUTC, postLink, postMessage, postFileText };
        });

        return { posts };
      });

      return { threads };
    });

    // console.log("Scraped Content:", content);
    if (content === "Content not found") {
      console.log(`error scraping: ${content}`);
      return;
    }

    await lookThroughThreads(content);
  } catch (error) {
    console.error("Error during scraping:", error);
  }

  await browser.close();
}

const lookThroughThreads = async (board) => {
  const keywords = [
    "airdrop",
    "wallet",
    "address",
    "addy",
    "drop",
    "giveaway",
    " tme",
    "tdotme",
    " t me",
    "free money",
  ];

  const patterns = [
    { regex: /0x[a-fA-F0-9]{40}/g, label: "ETH-adrress" }, // Pattern 1 with label
    { regex: /\b[a-zA-Z0-9]{44}\b/g, label: "SOL-address" }, // Pattern 2 with label
  ];

  const outputFile = "src/data/biz.json";

  const blockedData = JSON.parse(fs.readFileSync(outputFile, "utf-8"));
  let blockPostId = [];

  if (blockedData?.posts) blockPostId = blockedData.posts.map((post) => post.postId).slice(-50);

  const results = board.threads
    .map((thread) => {
      const matchingPosts = thread.posts
        .map((post) => {
          const matchedKeywords = keywords.filter(
            (keyword) =>
              post.postMessage.toLowerCase().includes(keyword) || post.postFileText.toLowerCase().includes(keyword)
          );

          const matchedPatterns = patterns
            .map(({ regex, label }) => {
              const postMatches = post.postMessage.match(regex) || [];
              const fileMatches = post.postFileText.match(regex) || [];
              return postMatches.length > 0 || fileMatches.length > 0 ? label : null;
            })
            .filter(Boolean);

          return matchedKeywords.length > 0 || matchedPatterns.length > 0
            ? { ...post, matchedKeywords, matchedPatterns }
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

  const newBlockedPosts = results.flatMap((thread) => thread.posts).sort((a, b) => a.dateUTC - b.dateUTC);

  console.log(newBlockedPosts);

  appendToJsonFile(outputFile, newBlockedPosts);
};

const appendToJsonFile = async (outputFile, newBlockedPosts) => {
  try {
    let data;

    try {
      const fileContent = await fs.readFileSync(outputFile, "utf-8");

      data = fileContent.trim() ? JSON.parse(fileContent) : {};

      if (!Array.isArray(data.posts)) data.posts = [];
    } catch (error) {
      data = { posts: [] };
    }

    data.posts.push(...newBlockedPosts);

    await fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error appending to JSON file:", error);
  }
};

function getRandomDelay() {
  // Generate a random delay between 2 and 4 minutes (in milliseconds)
  const min = 7 * 1000; // 2 minutes in milliseconds
  const max = 12 * 1000; // 4 minutes in milliseconds
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function startScraping() {
  console.log("Scraping website..." + new Date().toLocaleTimeString());
  scrapeWebsite();

  // Set a new random delay for the next scrape
  const randomDelay = getRandomDelay();
  console.log(`Next scrape in ${(randomDelay / 1000 / 60).toFixed(2)} minutes...`);
  setTimeout(startScraping, randomDelay);
}

startScraping();
