import { generateUuid } from "../service/id_service.mjs";
import inventoryModel from "../models/inventory.model.js";
import getErrorMessage from "../utils/errorHandler.js";
import type { Request, Response } from "express";
import { getBorrowedCountForBook } from "../models/borrow.model.mjs";

export default class inventoryController {
  // reading data from inventory
  async readFromInventory(req: Request, res: Response) {
    try {
      // to handle query like : /api/inventory?id=UUID
      const { id } = req.query;
      if (id) {
        if (typeof id !== "string") {
          return res.status(404).json({ Error: "Invalid ID provided" });
        }
        const inventoryHandler = new inventoryModel(id);
        const inventoryEntries = await inventoryHandler.readEntries();
        return inventoryEntries
          ? res.status(200).json(inventoryEntries)
          : res.status(404).json({
              Message: `No associated data with provided id: ${id} found!`,
            });
      }
      // if no id is provided then return the whole data
      const inventoryHandler = new inventoryModel();
      const inventoryEntries = await inventoryHandler.readEntries();
      return inventoryEntries
        ? res.status(200).json(inventoryEntries)
        : res.status(404).json({ Message: "Inventory is currently empty" });
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      return res
        .status(500)
        .json({ Error: `Internal Server Error => ${message}` });
    }
  }
  /**
   * Creates inventory entries.
   * Supports both single entry creation (via root body props) and bulk creation (via `inventory` array).
   *
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
   * @returns {Promise<Response>} 200 with result on success, or error status.
   */
  async pushToInventory(req: Request, res: Response) {
    try {
      /* 
      Taking bookid, totalqty, currentqty (default=totalqty)
      cols[_id,bookid,totalqty,currentqty,created_at,updated_at,deleted_at]
    */

      // Check for bulk import request
      if (req.body.inventory && Array.isArray(req.body.inventory)) {
        const items = req.body.inventory;
        if (items.length === 0) {
          return res
            .status(400)
            .json({ error: "Bad Request: Empty inventory list" });
        }

        const bulkHandler = new inventoryModel();
        const result = await bulkHandler.bulkCreateEntries(items);
        return res.status(200).json(result);
      }

      const { bookid, totalqty } = req.body;
      console.log(bookid, totalqty);
      let currentqty: number = req.body.currentqty;
      console.log(bookid, totalqty, currentqty);
      // check if a valid req.body is sent
      if (
        !bookid ||
        !totalqty ||
        (Array.isArray(bookid) && bookid.length === 0)
      ) {
        return res.status(400).json({
          error: "Bad Request: expected a non-empty fields",
        });
      }
      // if a valid currentqty given keep it or else set it to (default=totalqty)
      typeof currentqty === "number" ? currentqty : (currentqty = totalqty);
      // avoiding conflict check in controller as in other modules, coz conflict checker is now implemented within model
      // generating transaction id
      const transaction_id: string = generateUuid();
      const pushHandler = new inventoryModel(
        transaction_id,
        bookid,
        totalqty,
        currentqty
      );
      const inventoryEntries = await pushHandler.createEntry();
      return res.status(200).json(inventoryEntries);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      return res
        .status(500)
        .json({ Error: `Internal Server Error => ${message}` });
    }
  }
  /**
   * Safe soft-delete for inventory items.
   * Checks for active loans before deletion.
   * Supports bulk deletion via body `ids` array.
   */
  async deleteInventory(req: Request, res: Response) {
    try {
      const { id } = req.query; // Single Delete via query
      const { ids } = req.body; // Bulk Delete via body

      let targetIds: string[] = [];

      if (id && typeof id === "string") {
        targetIds.push(id);
      } else if (ids && Array.isArray(ids)) {
        targetIds = ids;
      }

      if (targetIds.length === 0) {
        return res
          .status(400)
          .json({ error: "No inventory IDs provided for deletion." });
      }

      // Safety Check: Check active loans for ALL targets
      const conflicts: string[] = [];

      for (const targetId of targetIds) {
        // getBorrowedCountForBook expects Inventory UUID (loaned_item)
        // We fixed this in borrow controller to pass inventory UUID.
        const count = await getBorrowedCountForBook(targetId);
        if (count > 0) {
          conflicts.push(targetId);
        }
      }

      if (conflicts.length > 0) {
        return res.status(409).json({
          error:
            "Operation aborted. The following inventory items are currently borrowed and cannot be deleted.",
          conflicting_ids: conflicts,
        });
      }

      // Proceed with deletion
      const inventoryHandler = new inventoryModel();
      const deletedItems = await inventoryHandler.deleteEntries(targetIds);

      if (deletedItems.length > 0) {
        return res.status(200).json({
          message: `Successfully deleted ${deletedItems.length} inventory item(s).`,
          data: deletedItems,
        });
      } else {
        return res.status(404).json({ error: "No records found to delete." });
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      return res
        .status(500)
        .json({ Error: `Internal Server Error => ${message}` });
    }
  }
}
