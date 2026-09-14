import crypto from "node:crypto";

const DEFAULT_SHOPEE_HOST = "https://partner.shopeemobile.com";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getShopeeConfig() {
  return {
    host: process.env.SHOPEE_HOST?.trim() || DEFAULT_SHOPEE_HOST,
    partnerId: requireEnv("SHOPEE_PARTNER_ID"),
    partnerKey: requireEnv("SHOPEE_PARTNER_KEY"),
    redirectUrl: requireEnv("SHOPEE_REDIRECT_URL"),
  };
}

export function getUnixTimestampSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export function signShopeePublicRequest(params: {
  partnerId: string;
  partnerKey: string;
  apiPath: string;
  timestamp: number;
}): string {
  const { partnerId, partnerKey, apiPath, timestamp } = params;
  const baseString = `${partnerId}${apiPath}${timestamp}`;

  return crypto
    .createHmac("sha256", partnerKey)
    .update(baseString)
    .digest("hex");
}
