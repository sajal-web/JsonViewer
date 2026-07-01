export interface ValidationError {
  message: string;
  line?: number;
  column?: number;
}

export type JsonType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export interface FlatNode {
  id: string; // JSON path (e.g. "$.store.book[0].title")
  key: string; // Object key or index (e.g. "title" or "0")
  value: any; // Raw value if primitive
  depth: number; // Nesting depth
  type: JsonType; // Type of node
  isExpanded: boolean; // Expansion state
  hasChildren: boolean; // Does it have nested properties/items?
  parentId?: string; // ID of parent
  size?: number; // Size if object (keys count) or array (length)
}

export interface SearchMatch {
  id: string; // Node path id
  matchType: 'key' | 'value' | 'both';
}

export type AppTheme = 'dark' | 'light';

export interface HistoryItem {
  id: string;
  timestamp: number;
  label: string;
  data: string;
}

export type AppPage = 'editor' | 'about' | 'contact' | 'terms' | 'privacy' | 'diff' | 'ticket-maker';


