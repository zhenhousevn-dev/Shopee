import { NextResponse } from "next/server";

import {
  getShopeeConfig,
  getUnixTimestampSeconds,
  signShopeePublicRequest,
} from "@/lib/shopee";

export const dynamic = "force-dynamic";

const AUTH_PARTNER_PATH = "/api/v2/shop/auth_partner";

export async function GET() {
  try {
    const config = getShopeeConfig();
    const timestamp = getUnixTimestampSeconds();
    const sign = signShopeePublicRequest({
      partnerId: config.partnerId,
      partnerKey: config.partnerKey,
      apiPath: AUTH_PARTNER_PATH,
      timestamp,
    });

    const authorizationUrl = new URL(
      AUTH_PARTNER_PATH,
      config.host,
    );

    authorizationUrl.searchParams.set("partner_id", config.partnerId);
    authorizationUrl.searchParams.set("timestamp", String(timestamp));
    authorizationUrl.searchParams.set("sign", sign);
    authorizationUrl.searchParams.set("redirect", config.redirectUrl);

    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown configuration error";

    return NextResponse.json(
      {
        ok: false,
        error: "Shopee OAuth is not configured correctly.",
        detail: message,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
