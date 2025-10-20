import closeBorrowLogs from "../models/return.model.mjs";

const returnBooks = async (req, res) => {
    // Ensure the body is an array of objects and not empty.
    const entries = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
        return res.status(400).json({ error: "Request body must be a non-empty array of transaction objects." });
    }

    // Extract all the transaction_ids into a simple array of strings.
    const transactionIds = entries.map(entry => entry.transaction_id);
    try {
        const updatedLogs = await closeBorrowLogs(transactionIds);
        // This handles cases where some IDs were invalid or already returned.
        if (updatedLogs) {
            return res.status(200).json({
                message: `Successfully processed return request. ${updatedLogs.length} book(s) were returned.`,
                data: updatedLogs
            });
        } else {
             return res.status(500).json({ error: "Failed to process return transaction." });
        }
    } catch (err) {
        return res.status(500).json({ error: "Something went wrong on our side. Please try again later" });
    }
}

export { returnBooks }