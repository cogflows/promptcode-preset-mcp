import path from "node:path";

export interface TreeNode {
  name: string;
  tokens?: number;          // undefined for directories
  children?: TreeNode[];    // undefined for files
}

export function buildTree(
  workspace: string,
  files: { path: string; tokens: number }[],
): TreeNode[] {
  const root: Record<string, TreeNode> = {};

  for (const { path: rel, tokens } of files) {
    const parts = rel.split(/[\\/]/);
    let cursor = root;

    parts.forEach((part, idx) => {
      if (!cursor[part]) {
        cursor[part] = { name: part };
      }
      if (idx === parts.length - 1) {
        // leaf file
        cursor[part].tokens = tokens;
      } else {
        cursor[part].children ??= {};
      }
      cursor = cursor[part].children as Record<string, TreeNode>;
    });
  }

  const toArray = (obj: Record<string, TreeNode>): TreeNode[] =>
    Object.values(obj)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(n =>
        n.children ? { ...n, children: toArray(n.children as any) } : n,
      );

  return toArray(root);
}

/** Convert the hierarchy into an indented text tree. */
export function treeToString(nodes: TreeNode[], depth = 0): string {
  const pad = "   ".repeat(depth);
  return nodes
    .map(n => {
      const line =
        pad +
        (depth ? "└─ " : "") +
        n.name +
        (n.tokens ? `  (${n.tokens})` : "");
      const kids = n.children ? "\n" + treeToString(n.children, depth + 1) : "";
      return line + kids;
    })
    .join("\n");
}