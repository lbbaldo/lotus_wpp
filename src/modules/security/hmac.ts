import crypto from "node:crypto";

export const verifyHmacSha256 = (args: {
  rawBody: string;
  timestamp: string;
  signatureHeader: string;
  secret: string;
}): boolean => {
  const payload = `${args.timestamp}.${args.rawBody}`;
  const expectedHex = crypto.createHmac("sha256", args.secret).update(payload).digest("hex");
  const receivedHex = args.signatureHeader.replace(/^sha256=/, "");

  if (receivedHex.length !== expectedHex.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(expectedHex, "hex"), Buffer.from(receivedHex, "hex"));
};

export const isTimestampInsideSkew = (timestampSec: string, maxSkewSeconds: number): boolean => {
  const parsed = Number(timestampSec);

  if (!Number.isFinite(parsed)) {
    return false;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  return Math.abs(nowSec - parsed) <= maxSkewSeconds;
};
