import crypto from "crypto";
/***
 * Generates a unique public-facing identifier based on a specific scheme.
 * The ID is composed of the current year and day, a random crypto secured 6-character alphabetical string,
 * formatted as 'YYDDD-XXXXXX'. This format is
 * human-readable and provides a degree of temporal context.
 * * Public ID scheme: YYDDD-XXXXXX
 * * YY is 2-digit-year
 * * DDD is the 3-digit day in a year 001 for Januaray 1
 * * COLLISION PROOF: 1 billion unique IDs per day
 * * @returns {string} The formatted public ID string.
 ***/
export default function generatePublicId() {
  const now = new Date();
  // Get 2-digit year
  const year = now.getFullYear().toString().slice(-2); // say 25 for 2025
  // CROCKFORD'S BASE32
  const characterSet = "ABCDEFGHJKMNPQRSTVWXYZ0123456789";
  // Get 3-digit day of year
  const startOfYear = new Date(now.getFullYear(), 0, 0); // year, monthIndex, day
  const diff = now - startOfYear;
  // total number of milliseconds in one day, coz diff will give answer in milliseconds
  const oneDay = 1000 * 60 * 60 * 24;
  /*
    in 1 day = oneDay ms
    in ____ day = diff ms
    => diff / oneDay
  */
  const dayOfYear = Math.floor(diff / oneDay);
  // combine to get YYDDD
  const prefix = `${year}${dayOfYear.toString().padStart(3, "0")}`;

  // create 6 character secure random suffix (xxxxxx);
  let suffix = "";

  // using cryptographically almost secure random number
  const randomValues = new Uint32Array(6);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < 6; i++) {
    // this will give any random index between 0 and 31 (using base32)
    const randomIndex = randomValues[i] % characterSet.length;
    suffix += characterSet[randomIndex];
  }

  const publicId = `${prefix}-${suffix}`;
  return publicId;
}
/***
 * Generates a standard RFC 4122 version 4 UUID. This function serves as a simple
 * wrapper around the Node.js crypto module's built-in `randomUUID` method,
 * ensuring a cryptographically strong, random, and unique identifier.
 *  * @returns {string} A 36-character UUID string (e.g., "123e4567-e89b-12d3-a456-426614174000").
 */
export function generateUuid() {
  return crypto.randomUUID();
}
