// Web worker for offloading JSON/YAML parsing and flattening of huge files.
import { getJsonType, getChildrenCount } from '../utils/treeUtils';
import { parseJsonWithErrorInfo, parseYamlWithErrorInfo } from '../utils/jsonParser';

self.onmessage = (event: MessageEvent) => {
  const { action, payload } = event.data;

  if (action === 'parse') {
    const { text, mode } = payload; // mode: 'json' | 'yaml'
    const startTime = performance.now();

    const parseResult =
      mode === 'json'
        ? parseJsonWithErrorInfo(text)
        : parseYamlWithErrorInfo(text);

    const duration = performance.now() - startTime;

    if (parseResult.success) {
      self.postMessage({
        action: 'parseResult',
        payload: {
          success: true,
          data: parseResult.data,
          duration,
        },
      });
    } else {
      self.postMessage({
        action: 'parseResult',
        payload: {
          success: false,
          error: parseResult.error,
          duration,
        },
      });
    }
  }

  if (action === 'flatten') {
    const { data, expandedPathsArray } = payload;
    const expandedPaths = new Set<string>(expandedPathsArray);
    const result: any[] = [];

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

      const node = {
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

    if (data !== undefined) {
      traverse(data, 'root', '$', 0);
    }

    self.postMessage({
      action: 'flattenResult',
      payload: {
        nodes: result,
      },
    });
  }
};
