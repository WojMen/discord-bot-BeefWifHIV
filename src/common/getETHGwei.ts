import axios from "axios";
import logger from "./logger.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

const getEthGasPrice = async (): Promise<string> => {
  try {
    const response = await axios.get(`https://api.etherscan.io/api`, {
      params: {
        module: "gastracker",
        action: "gasoracle",
        apikey: ETHERSCAN_API_KEY,
      },
    });

    // Etherscan's API returns the gas price in Gwei directly
    const gasData = response.data.result;
    const gasPriceGwei = parseFloat(gasData.FastGasPrice).toFixed(2);

    return gasPriceGwei || "0";
  } catch (error) {
    logger.error("Error while fetching getEthGasPrice:", error);
    return "0";
  }
};

export default getEthGasPrice;
