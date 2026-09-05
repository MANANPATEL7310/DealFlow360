// apps/api/src/modules/customer/customer.controller.ts
// === M2: Customer + Contact controllers ===
//
// All handlers follow the same envelope pattern as M1:
// delegate to service → return via sendOk/sendCreated/sendNotFound.

import type { Request, Response } from "express";
import { sendCreated, sendNotFound, sendOk } from "../../lib/response.js";
import {
  customerService,
  listContacts,
  addContact,
} from "./customer.service.js";

// ─── Customer controllers ─────────────────────────────────────────────────────

export async function listCustomersController(_req: Request, res: Response) {
  return sendOk(res, await customerService.findMany({}));
}

export async function getCustomerController(req: Request, res: Response) {
  const customer = await customerService.findById(req.params.id as string);
  return customer
    ? sendOk(res, customer)
    : sendNotFound(res, "Customer not found.");
}

export async function createCustomerController(req: Request, res: Response) {
  return sendCreated(
    res,
    await customerService.create(req.body),
    "Customer created.",
  );
}

export async function updateCustomerController(req: Request, res: Response) {
  return sendOk(
    res,
    await customerService.update(req.params.id as string, req.body),
    "Customer updated.",
  );
}

export async function deleteCustomerController(req: Request, res: Response) {
  await customerService.delete(req.params.id as string);
  return sendOk(res, { id: req.params.id }, "Customer deleted.");
}

// ─── Contact controllers ──────────────────────────────────────────────────────

export async function listContactsController(req: Request, res: Response) {
  return sendOk(res, await listContacts(req.params.id as string));
}

export async function addContactController(req: Request, res: Response) {
  return sendCreated(
    res,
    await addContact(req.params.id as string, req.body),
    "Contact added.",
  );
}
