#!/bin/bash
# Usage: pnpm gen:module <module-name>
# Example: pnpm gen:module products

NAME=$1
if [ -z "$NAME" ]; then
  echo "❌ Usage: pnpm gen:module <module-name>"
  exit 1
fi

DIR="apps/api/src/modules/$NAME"

if [ -d "$DIR" ]; then
  echo "❌ Module '$NAME' already exists!"
  exit 1
fi

mkdir -p "$DIR"

# Convert kebab-case to camelCase and PascalCase
CAMEL_NAME=$(echo "$NAME" | awk -F- '{printf "%s", $1; for(i=2;i<=NF;i++) printf "%s", toupper(substr($i,1,1)) substr($i,2)}')
PASCAL_NAME="$(tr '[:lower:]' '[:upper:]' <<< ${CAMEL_NAME:0:1})${CAMEL_NAME:1}"

# ── Routes ──
cat > "$DIR/$NAME.routes.ts" << EOF
import { requireAuth } from "../../middleware/require-auth.js";
import { createRouter } from "../../lib/create-router.js";
import { createController, listController, getByIdController, deleteController } from "./$NAME.controller.js";

export const ${CAMEL_NAME}Router = createRouter();

${CAMEL_NAME}Router.use(requireAuth);
${CAMEL_NAME}Router.post("/", createController);
${CAMEL_NAME}Router.get("/", listController);
${CAMEL_NAME}Router.get("/:id", getByIdController);
${CAMEL_NAME}Router.delete("/:id", deleteController);
EOF

# ── Controller ──
cat > "$DIR/$NAME.controller.ts" << EOF
import type { Request, Response } from "express";
import { sendOk, sendCreated } from "../../lib/response.js";

export async function createController(req: Request, res: Response) {
  // TODO: Call your service here
  return sendCreated(res, { message: "Created" });
}

export async function listController(_req: Request, res: Response) {
  // TODO: Call your service here
  return sendOk(res, { items: [], total: 0 });
}

export async function getByIdController(req: Request, res: Response) {
  const { id } = req.params;
  // TODO: Call your service here
  return sendOk(res, { id });
}

export async function deleteController(req: Request, res: Response) {
  const { id } = req.params;
  // TODO: Call your service here
  return sendOk(res, { message: "Deleted", id });
}
EOF

# ── Service ──
cat > "$DIR/$NAME.service.ts" << EOF
import { createCrudService } from "../../lib/crud-factory.js";

// Generates findMany, findById, create, update, delete for the prisma model.
// Uncomment this once you have added the model to schema.prisma:
// export const ${CAMEL_NAME}Service = createCrudService("$NAME");
EOF

echo ""
echo "✅ Module '$NAME' created at: $DIR/"
echo ""
echo "📌 Next step — register the route in apps/api/src/routes/index.ts:"
echo ""
echo "   import { ${CAMEL_NAME}Router } from \"../modules/$NAME/$NAME.routes.js\";"
echo "   apiRouter.use(\"/$NAME\", ${CAMEL_NAME}Router);"
echo ""
