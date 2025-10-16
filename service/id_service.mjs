import crypto from "crypto";
/***
 * Generates a unique public-facing identifier based on a specific scheme.
 * The ID is composed of the current year, a random 4-character alphabetical string,
 * and a random 6-digit number, formatted as 'YYYY-ABCD-123123'. This format is
 * human-readable and provides a degree of temporal context.
 * * Public ID scheme: YYYY-ABCD-123123
 * * @returns {string} The formatted public ID string.
 ***/
export default function generatePublicId() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const characterSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomNumberPart = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");

  let randomCharacterPart = "";
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * characterSet.length);
    randomCharacterPart += characterSet[randomIndex];
  }

  const publicId = `${year}-${randomCharacterPart}-${randomNumberPart}`;
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
