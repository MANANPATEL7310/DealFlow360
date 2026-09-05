#!/bin/bash
# Usage: pnpm gen:feature <feature-name>
# Example: pnpm gen:feature products

NAME=$1
if [ -z "$NAME" ]; then
  echo "❌ Usage: pnpm gen:feature <feature-name>"
  exit 1
fi

DIR="apps/web/src/features/$NAME"

if [ -d "$DIR" ]; then
  echo "❌ Feature '$NAME' already exists!"
  exit 1
fi

mkdir -p "$DIR/api" "$DIR/hooks" "$DIR/pages" "$DIR/components"

# Convert kebab-case to camelCase and PascalCase
CAMEL_NAME=$(echo "$NAME" | awk -F- '{printf "%s", $1; for(i=2;i<=NF;i++) printf "%s", toupper(substr($i,1,1)) substr($i,2)}')
PASCAL_NAME="$(tr '[:lower:]' '[:upper:]' <<< ${CAMEL_NAME:0:1})${CAMEL_NAME:1}"

# ── API service ──
cat > "$DIR/api/$NAME-service.ts" << EOF
import { apiClient } from "@/services/http/api-client";

export const ${CAMEL_NAME}Api = {
  list: () => apiClient.get("/$NAME").then((r) => r.data),
  getById: (id: string) => apiClient.get(\`/$NAME/\${id}\`).then((r) => r.data),
  create: (data: unknown) => apiClient.post("/$NAME", data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(\`/$NAME/\${id}\`).then((r) => r.data),
};
EOF

# ── React Query hooks ──
cat > "$DIR/hooks/use-$NAME.ts" << EOF
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ${CAMEL_NAME}Api } from "../api/$NAME-service";

export function use${PASCAL_NAME}List() {
  return useQuery({
    queryKey: ["$NAME"],
    queryFn: ${CAMEL_NAME}Api.list,
  });
}

export function useCreate${PASCAL_NAME}() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ${CAMEL_NAME}Api.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["$NAME"] });
      toast.success("Created successfully!");
    },
    onError: () => toast.error("Failed to create"),
  });
}

export function useDelete${PASCAL_NAME}() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ${CAMEL_NAME}Api.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["$NAME"] });
      toast.success("Deleted!");
    },
  });
}
EOF

# ── Page ──
cat > "$DIR/pages/$NAME-page.tsx" << EOF
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { use${PASCAL_NAME}List } from "../hooks/use-$NAME";

export function ${PASCAL_NAME}Page() {
  const { data, isLoading } = use${PASCAL_NAME}List();

  if (isLoading) {
    return (
      <Card className="flex items-center gap-3 text-sm text-muted-foreground">
        <Spinner size="sm" />
        Loading...
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="page-title">${PASCAL_NAME}</h1>
        <p className="page-copy">Manage your ${NAME} here.</p>
      </div>
      {/* TODO: Add your UI here */}
    </section>
  );
}
EOF

echo ""
echo "✅ Feature '$NAME' created at: $DIR/"
echo ""
echo "📌 Next steps:"
echo "  1. Add route to packages/shared/src/config/routes.ts"
echo "  2. Add route to apps/web/src/router/index.tsx"
echo "  3. Add sidebar link to apps/web/src/config/navigation.ts"
echo ""
