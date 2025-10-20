import { db, pgp } from '../models/db.mjs';
import generatePublicId  from '../service/id_service.mjs'; 
import conflict_check from '../models/conflictHandler.model.mjs'; 

/**
 * This is a one-time-use script to clear old public_ids and then
 * generate and backfill a unique, custom-formatted public_id for all
 * existing users in the database.
 */
async function backfillUserIds() {
    console.log("Starting backfill process for user public_ids...");

    try {
        // --- NEW STEP: Clear all existing public_id values ---
        console.log("Step 1: Clearing all old public_id values to NULL...");
        const result = await db.result('UPDATE users SET public_id = NULL');
        console.log(`Cleared public_id for ${result.rowCount} user(s).`);
        // --- END OF NEW STEP ---


        // 1. Fetch all users who do not have a public_id yet (which is now all of them).
        console.log("\nStep 2: Fetching all users to generate new IDs...");
        const usersToUpdate = await db.any('SELECT internal_id FROM users WHERE public_id IS NULL');

        if (usersToUpdate.length === 0) {
            console.log("✅ No users found to update. The table might be empty.");
            return;
        }

        console.log(`Found ${usersToUpdate.length} user(s) needing a new public_id.`);

        // 2. Loop through each user and generate/save a unique ID.
        console.log("\nStep 3: Generating and saving new unique IDs...");
        for (const user of usersToUpdate) {
            let newPublicId;
            let isUnique = false;

            // 3. Generate-and-check loop to guarantee uniqueness
            do {
                newPublicId = generatePublicId();
                
                const idExists = await conflict_check({
                    tableName: 'users',
                    colName: 'public_id',
                    value: newPublicId
                });

                if (!idExists) {
                    isUnique = true;
                } else {
                    console.warn(`Collision detected for ID: ${newPublicId}. Regenerating...`);
                }
            } while (!isUnique);
            
            // 4. Update the database with the guaranteed unique ID
            await db.none('UPDATE users SET public_id = $1 WHERE internal_id = $2', [newPublicId, user.internal_id]);
        }

        console.log("\n✅ Backfill process completed successfully!");

    } catch (err) {
        console.error("❌ An error occurred during the backfill process:", err);
    } finally {
        // 5. Important: Close the database connection to allow the script to exit.
        pgp.end();
    }
}

// Run the script
backfillUserIds();

