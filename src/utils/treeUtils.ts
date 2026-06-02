import type { FlatNode, JsonType } from '../types';

export function getJsonType(val: any): JsonType {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'array';
  return typeof val as JsonType;
}

export function getChildrenCount(val: any, type: JsonType): number {
  if (type === 'object') return Object.keys(val).length;
  if (type === 'array') return val.length;
  return 0;
}

/**
 * Dynamically builds a flat list of visible nodes based on expanded paths.
 * Highly optimized to avoid traversing collapsed branches, keeping runtime proportional
 * to visible node count rather than total JSON size.
 */
export function flattenJson(
  data: any,
  expandedPaths: Set<string>,
  rootKey: string = 'root'
): FlatNode[] {
  const result: FlatNode[] = [];


  function traverse(
    val: any,
    key: string,
    path: string,
    depth: number,
    parentId?: string
  ) {
    const type = getJsonType(val);
    const hasChildren = type === 'object' || type === 'array';
    const isExpanded = expandedPaths.has(path);
    const size = hasChildren ? getChildrenCount(val, type) : undefined;

    const node: FlatNode = {
      id: path,
      key,
      value: hasChildren ? undefined : val,
      depth,
      type,
      isExpanded,
      hasChildren,
      parentId,
      size,
    };

    result.push(node);

    if (hasChildren && isExpanded && val) {
      if (type === 'object') {
        const keys = Object.keys(val);
        for (const k of keys) {
          const childPath = path === '$' ? `$.${k}` : `${path}.${k}`;
          traverse(val[k], k, childPath, depth + 1, path);
        }
      } else if (type === 'array') {
        for (let i = 0; i < val.length; i++) {
          const childPath = `${path}[${i}]`;
          traverse(val[i], `[${i}]`, childPath, depth + 1, path);
        }
      }
    }
  }

  // Traverse from root
  if (data !== undefined) {
    traverse(data, rootKey, '$', 0);
  }

  return result;
}

/**
 * Auto-expands nodes that contain keys or values matching the query.
 * Returns the set of paths that should be expanded.
 */
export function getPathsMatchingSearch(data: any, query: string): Set<string> {
  const matchingPaths = new Set<string>();
  const parentPaths = new Set<string>();
  const lowercaseQuery = query.toLowerCase();

  if (!query) return matchingPaths;

  function traverse(val: any, path: string) {
    const type = getJsonType(val);

    // Check key matching from parent (not applicable for root itself)
    // and check value matching
    let isMatch = false;

    if (type === 'object' && val) {
      const keys = Object.keys(val);
      for (const k of keys) {
        const childPath = path === '$' ? `$.${k}` : `${path}.${k}`;
        if (k.toLowerCase().includes(lowercaseQuery)) {
          matchingPaths.add(childPath);
          addParentPaths(childPath);
        }
        traverse(val[k], childPath);
      }
    } else if (type === 'array' && val) {
      for (let i = 0; i < val.length; i++) {
        const childPath = `${path}[${i}]`;
        traverse(val[i], childPath);
      }
    } else {
      // Primitive match
      const stringVal = String(val).toLowerCase();
      if (stringVal.includes(lowercaseQuery)) {
        isMatch = true;
      }
    }

    if (isMatch) {
      matchingPaths.add(path);
      addParentPaths(path);
    }
  }

  function addParentPaths(path: string) {
    let current = path;
    while (current.includes('.')) {
      const lastDot = current.lastIndexOf('.');
      current = current.substring(0, lastDot);
      if (current && current !== '$') {
        parentPaths.add(current);
      }
    }
    // Handle array paths (e.g. $[0] or $.store.book[0])
    current = path;
    while (current.includes('[')) {
      const lastBracket = current.lastIndexOf('[');
      current = current.substring(0, lastBracket);
      if (current && current !== '$') {
        parentPaths.add(current);
      }
    }
    parentPaths.add('$');
  }

  traverse(data, '$');
  return new Set([...matchingPaths, ...parentPaths]);
}
