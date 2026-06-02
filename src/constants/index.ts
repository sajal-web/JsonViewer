export const DEFAULT_JSON_MOCK = {
  "appName": "JSON Viewer",
  "version": "1.0.0",
  "status": "active",
  "features": [
    "Syntax Highlighting via Monaco Editor",
    "High-performance Virtualized Tree View",
    "Real-time JSON/YAML Validation & Formatting",
    "Framer Motion Animated Transitions",
    "Subtle Glassmorphic SaaS Design",
    "Web Worker Parsing for Large Files (50MB+)"
  ],
  "performance": {
    "engine": "Web Worker + Virtualized DOM",
    "testedSizeMB": 100,
    "rendersAt60FPS": true,
    "dynamicFlattening": true
  },
  "settings": {
    "theme": "dark",
    "editor": {
      "tabSize": 2,
      "fontSize": 14,
      "minimap": false,
      "wordWrap": "on"
    },
    "treeView": {
      "showTypeBadges": true,
      "showItemCount": true,
      "expandDepthOnLoad": 2
    }
  },
  "metadata": {
    "author": {
      "name": "Antigravity Devs",
      "github": "https://github.com/google-deepmind",
      "active": null
    },
    "projects": [
      {
        "id": "proj_01",
        "name": "Raycast Integrations",
        "stars": 12500,
        "tags": ["productivity", "developer-tools"]
      },
      {
        "id": "proj_02",
        "name": "Postman Exporter",
        "stars": 8200,
        "tags": ["api", "testing"]
      }
    ]
  }
};

export const SHORTCUTS = [
  { keys: "Ctrl + S / Cmd + S", action: "Download JSON file" },
  { keys: "Ctrl + F / Cmd + F", action: "Search inside JSON tree" },
  { keys: "Ctrl + Shift + F / Cmd + Shift + F", action: "Format JSON / YAML" },
  { keys: "Ctrl + O / Cmd + O", action: "Upload document file" },
  { keys: "Tab", action: "Indent editor contents" }
];
