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

const res = highLightTokenAddress("C4j7kPx9PqDnfvxe2uycJQRTAeyGwmU4DyGf21Xgpump", "\\b[a-zA-Z0-9]{44}\\b");
console.log(res);
