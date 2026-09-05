# AI Agent Rules for this Workspace

## When to Plan vs. When to Code

To save tokens and time, use judgment on whether a request requires a plan:

### NO PLAN NEEDED (Execute Immediately):
Do NOT write a plan for small, straightforward tasks. If the user asks for:
- Minor UI tweaks (colors, padding, layout fixes)
- Simple bug fixes or syntax corrections
- Adding a single field to an existing component
- Running terminal commands
**Action:** Write the code directly. No planning needed.

### MANDATORY PLANNING WORKFLOW (For Complex Tasks):
If the user asks for a **new feature, major refactor, or complex logic**, you MUST:
1. Create a detailed `implementation_plan.md` and save it to the `.planning/` directory.
2. The plan should outline schema changes, API routes, and components.
3. Wait for the user's explicit approval of the markdown plan.
4. Do NOT write any source code until the user approves the plan.
