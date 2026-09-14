import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import { signShopeePublicRequest } from "../lib/shopee.ts";

test("public request signature uses partner_id + api_path + timestamp", () => {
  const partnerId = "123456";
  const partnerKey = "test-partner-key";
  const apiPath = "/api/v2/shop/auth_partner";
  const timestamp = 1_700_000_000;

  const expected = crypto
    .createHmac("sha256", partnerKey)
    .update(`${partnerId}${apiPath}${timestamp}`)
    .digest("hex");

  const actual = signShopeePublicRequest({
    partnerId,
    partnerKey,
    apiPath,
    timestamp,
  });

  assert.equal(actual, expected);
});
