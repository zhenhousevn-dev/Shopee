import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")?.trim();
  const shopId = request.nextUrl.searchParams.get("shop_id")?.trim();

  if (!code || !shopId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing code or shop_id from Shopee callback.",
        has_code: Boolean(code),
        has_shop_id: Boolean(shopId),
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  // Checkpoint 1 only: prove that Shopee redirected back successfully.
  // Do not log or return the authorization code.
  // Token exchange and persistence belong to Checkpoint 2.
  return NextResponse.json(
    {
      ok: true,
      checkpoint: "oauth-callback-received",
      shop_id: shopId,
      has_code: true,
      next: "Exchange authorization code for tokens in Checkpoint 2.",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
