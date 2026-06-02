import type { ValidationError } from '../types';
import * as YAML from 'yaml';


/**
 * Extracts line and column from a JSON parsing SyntaxError message.
 */
export function parseJsonWithErrorInfo(str: string): { success: true; data: any } | { success: false; error: ValidationError } {
  try {
    const data = JSON.parse(str);
    return { success: true, data };
  } catch (err: any) {
    const message = err.message || 'Invalid JSON';
    let line = 1;
    let column = 1;

    // Try to extract position from V8 style: "at position 42"
    const posMatch = message.match(/at position (\d+)/i);
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      const linesBefore = str.substring(0, pos).split('\n');
      line = linesBefore.length;
      column = linesBefore[linesBefore.length - 1].length + 1;
    } else {
      // Try to extract line/column from message directly (e.g. "line 2 column 5")
      const lineColMatch = message.match(/line (\d+) column (\d+)/i);
      if (lineColMatch) {
        line = parseInt(lineColMatch[1], 10);
        column = parseInt(lineColMatch[2], 10);
      } else {
        // Fallback for Safari style: "at line 5"
        const safariLineMatch = message.match(/line (\d+)/i);
        if (safariLineMatch) {
          line = parseInt(safariLineMatch[1], 10);
          column = 1;
        }
      }
    }

    return {
      success: false,
      error: {
        message: message.replace(/\s+at\s+position\s+\d+/i, '').replace(/\s+at\s+line\s+\d+\s+column\s+\d+/i, ''),
        line,
        column,
      },
    };
  }
}

/**
 * Validates and parses YAML, returning standard result.
 */
export function parseYamlWithErrorInfo(str: string): { success: true; data: any } | { success: false; error: ValidationError } {
  try {
    const data = YAML.parse(str);
    return { success: true, data };
  } catch (err: any) {
    // YAML error objects have a 'linePos' property: [{ line: 2, col: 5 }]
    let line = 1;
    let column = 1;
    if (err.linePos && err.linePos[0]) {
      line = err.linePos[0].line;
      column = err.linePos[0].col;
    }
    return {
      success: false,
      error: {
        message: err.message || 'Invalid YAML',
        line,
        column,
      },
    };
  }
}

/**
 * Converts JSON string or object to YAML
 */
export function jsonToYaml(jsonStr: string): string {
  try {
    const obj = JSON.parse(jsonStr);
    return YAML.stringify(obj, { indent: 2 });
  } catch {
    // If it's not valid JSON, try to parse with our parser first or just throw
    const result = parseJsonWithErrorInfo(jsonStr);
    if (result.success) {
      return YAML.stringify(result.data, { indent: 2 });
    }
    throw new Error('Cannot convert invalid JSON to YAML');
  }
}

/**
 * Converts YAML to JSON
 */
export function yamlToJson(yamlStr: string, indent: number = 2): string {
  try {
    const obj = YAML.parse(yamlStr);
    return JSON.stringify(obj, null, indent);
  } catch (err: any) {
    throw new Error(err.message || 'Cannot convert invalid YAML to JSON');
  }
}
