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

/**
 * Recursively generates TypeScript interfaces from a JSON object.
 */
export type CodeLanguage = 'typescript' | 'python' | 'go' | 'csharp' | 'java' | 'kotlin' | 'swift';

export const languageDisplayNames: Record<CodeLanguage, string> = {
  typescript: 'TypeScript',
  python: 'Python',
  go: 'Go',
  csharp: 'C#',
  java: 'Java',
  kotlin: 'Kotlin',
  swift: 'Swift',
};

export function jsonToTypeScript(val: any, interfaceName: string = 'RootObject'): string {
  const interfaces: string[] = [];

  function generate(obj: any, name: string): string {
    if (obj === null) return 'any';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'any[]';
      const types = new Set<string>();
      obj.forEach((item) => {
        types.add(generate(item, `${name}Item`));
      });
      const unionType = Array.from(types).join(' | ');
      return unionType.includes(' | ') ? `(${unionType})[]` : `${unionType}[]`;
    }
    if (typeof obj === 'object') {
      // Capitalize name
      const capName = name.charAt(0).toUpperCase() + name.slice(1).replace(/[^a-zA-Z0-9_$]/g, '');
      let body = `export interface ${capName} {\n`;
      const keys = Object.keys(obj);
      if (keys.length === 0) return 'Record<string, any>';
      
      keys.forEach((key) => {
        const cleanKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
        const childName = name + key.charAt(0).toUpperCase() + key.slice(1).replace(/[^a-zA-Z0-9_$]/g, '');
        const valueType = generate(obj[key], childName);
        body += `  ${cleanKey}: ${valueType};\n`;
      });
      body += '}';
      interfaces.push(body);
      return capName;
    }
    return typeof obj;
  }

  const rootType = generate(val, interfaceName);
  
  if (typeof val !== 'object' || val === null) {
    return `export type ${interfaceName} = ${rootType};`;
  }
  
  return interfaces.filter((v, i, self) => self.indexOf(v) === i).join('\n\n');
}

function capitalizeName(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1).replace(/[^a-zA-Z0-9]/g, '');
}

function toPascalCase(input: string) {
  return input
    .replace(/[_\- ]+/g, ' ')
    .split(' ')
    .map((word) => capitalizeName(word))
    .join('') || 'Field';
}

function getCommonArrayType(types: Set<string>) {
  if (types.size === 1) return Array.from(types)[0];
  if (types.has('any')) return 'any';
  return 'any';
}

export function jsonToPython(val: any, className: string = 'RootObject'): string {
  const classes: string[] = [];
  const imports = new Set<string>(['from dataclasses import dataclass']);

  function safeName(key: string) {
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) return key;
    return `field_${Math.random().toString(36).slice(2, 8)}`;
  }

  function generate(obj: any, name: string): string {
    if (obj === null) {
      imports.add('from typing import Optional, Any');
      return 'Optional[Any]';
    }
    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        imports.add('from typing import List, Any');
        return 'List[Any]';
      }
      const types = new Set<string>();
      obj.forEach((item) => types.add(generate(item, `${name}Item`)));
      const elementType = getCommonArrayType(types);
      imports.add('from typing import List');
      return `List[${elementType}]`;
    }
    if (typeof obj === 'object') {
      const className = toPascalCase(name);
      const fields: string[] = [];
      const keys = Object.keys(obj);
      if (keys.length === 0) {
        imports.add('from typing import Any');
        return 'Any';
      }
      keys.forEach((key) => {
        const fieldName = safeName(key);
        const childType = generate(obj[key], `${name}_${key}`);
        fields.push(`    ${fieldName}: ${childType}`);
      });
      classes.unshift(`@dataclass\nclass ${className}:\n${fields.join('\n')}`);
      return className;
    }
    if (typeof obj === 'boolean') return 'bool';
    if (typeof obj === 'number') return Number.isInteger(obj) ? 'int' : 'float';
    if (typeof obj === 'string') return 'str';
    imports.add('from typing import Any');
    return 'Any';
  }

  generate(val, className);
  const importLines = Array.from(imports).sort().join('\n');
  const body = classes.join('\n\n');
  return [importLines, '', body].join('\n').trim();
}

export function jsonToGo(val: any, structName: string = 'RootObject'): string {
  const structs: string[] = [];

  function goType(obj: any, name: string): string {
    if (obj === null) return 'interface{}';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]interface{}';
      const types = new Set<string>();
      obj.forEach((item) => types.add(goType(item, `${name}Item`)));
      const elementType = getCommonArrayType(types);
      return `[]${elementType}`;
    }
    if (typeof obj === 'object') {
      const typeName = toPascalCase(name);
      const lines = ['type ' + typeName + ' struct {'];
      Object.entries(obj).forEach(([key, value]) => {
        const fieldName = toPascalCase(key) || 'Field';
        const fieldType = goType(value, `${name}_${key}`);
        lines.push(`    ${fieldName} ${fieldType} ` + `\`json:"${key},omitempty"\``);
      });
      lines.push('}');
      structs.unshift(lines.join('\n'));
      return typeName;
    }
    if (typeof obj === 'boolean') return 'bool';
    if (typeof obj === 'number') return Number.isInteger(obj) ? 'int' : 'float64';
    if (typeof obj === 'string') return 'string';
    return 'interface{}';
  }

  goType(val, structName);
  return structs.join('\n\n');
}

export function jsonToCSharp(val: any, className: string = 'RootObject'): string {
  const classes: string[] = [];

  function csharpType(obj: any, name: string): string {
    if (obj === null) return 'object';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'List<object>';
      const types = new Set<string>();
      obj.forEach((item) => types.add(csharpType(item, `${name}Item`)));
      const elementType = getCommonArrayType(types);
      return `List<${elementType}>`;
    }
    if (typeof obj === 'object') {
      const typeName = toPascalCase(name);
      const lines = [`public class ${typeName} {`];
      Object.entries(obj).forEach(([key, value]) => {
        const fieldName = toPascalCase(key) || 'Field';
        const fieldType = csharpType(value, `${name}_${key}`);
        lines.push(`    public ${fieldType} ${fieldName} { get; set; }`);
      });
      lines.push('}');
      classes.unshift(lines.join('\n'));
      return typeName;
    }
    if (typeof obj === 'boolean') return 'bool';
    if (typeof obj === 'number') return Number.isInteger(obj) ? 'int' : 'double';
    if (typeof obj === 'string') return 'string';
    return 'object';
  }

  csharpType(val, className);
  const header = classes.length > 0 ? 'using System.Collections.Generic;\n\n' : '';
  return `${header}${classes.join('\n\n')}`.trim();
}

export function jsonToJava(val: any, className: string = 'RootObject'): string {
  const classes: string[] = [];

  function javaType(obj: any, name: string): string {
    if (obj === null) return 'Object';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'List<Object>';
      const types = new Set<string>();
      obj.forEach((item) => types.add(javaType(item, `${name}Item`)));
      const elementType = getCommonArrayType(types);
      return `List<${elementType}>`;
    }
    if (typeof obj === 'object') {
      const typeName = toPascalCase(name);
      const lines = [`public class ${typeName} {`];
      Object.entries(obj).forEach(([key, value]) => {
        const fieldName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `field${Math.random().toString(36).slice(2, 6)}`;
        const fieldType = javaType(value, `${name}_${key}`);
        lines.push(`    public ${fieldType} ${fieldName};`);
      });
      lines.push('}');
      classes.unshift(lines.join('\n'));
      return typeName;
    }
    if (typeof obj === 'boolean') return 'boolean';
    if (typeof obj === 'number') return Number.isInteger(obj) ? 'int' : 'double';
    if (typeof obj === 'string') return 'String';
    return 'Object';
  }

  javaType(val, className);
  const header = classes.some((cls) => cls.includes('List<')) ? 'import java.util.List;\n\n' : '';
  return `${header}${classes.join('\n\n')}`.trim();
}

export function jsonToKotlin(val: any, className: string = 'RootObject'): string {
  const classes: string[] = [];

  function kotlinType(obj: any, name: string): string {
    if (obj === null) return 'Any?';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'List<Any?>';
      const types = new Set<string>();
      obj.forEach((item) => types.add(kotlinType(item, `${name}Item`)));
      const elementType = getCommonArrayType(types);
      return `List<${elementType}>`;
    }
    if (typeof obj === 'object') {
      const typeName = toPascalCase(name);
      const properties: string[] = [];
      Object.entries(obj).forEach(([key, value]) => {
        const fieldName = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) ? key : `field${Math.random().toString(36).slice(2, 6)}`;
        const fieldType = kotlinType(value, `${name}_${key}`);
        properties.push(`    val ${fieldName}: ${fieldType}`);
      });
      classes.unshift(`data class ${typeName}(\n${properties.join(',\n')}\n)`);
      return typeName;
    }
    if (typeof obj === 'boolean') return 'Boolean';
    if (typeof obj === 'number') return Number.isInteger(obj) ? 'Int' : 'Double';
    if (typeof obj === 'string') return 'String';
    return 'Any?';
  }

  kotlinType(val, className);
  return classes.join('\n\n');
}

export function jsonToSwift(val: any, structName: string = 'RootObject'): string {
  const structs: string[] = [];

  function swiftType(obj: any, name: string): string {
    if (obj === null) return 'Any?';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[Any?]';
      const types = new Set<string>();
      obj.forEach((item) => types.add(swiftType(item, `${name}Item`)));
      const elementType = getCommonArrayType(types);
      return `[${elementType}]`;
    }
    if (typeof obj === 'object') {
      const typeName = toPascalCase(name);
      const fields: string[] = [];
      Object.entries(obj).forEach(([key, value]) => {
        const fieldName = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) ? key : `_field${Math.random().toString(36).slice(2, 6)}`;
        const fieldType = swiftType(value, `${name}_${key}`);
        fields.push(`    let ${fieldName}: ${fieldType}`);
      });
      structs.unshift(`struct ${typeName}: Codable {\n${fields.join('\n')}\n}`);
      return typeName;
    }
    if (typeof obj === 'boolean') return 'Bool';
    if (typeof obj === 'number') return Number.isInteger(obj) ? 'Int' : 'Double';
    if (typeof obj === 'string') return 'String';
    return 'Any?';
  }

  swiftType(val, structName);
  return structs.join('\n\n');
}

export function jsonToLanguage(val: any, language: CodeLanguage, rootName: string = 'RootObject'): string {
  switch (language) {
    case 'typescript':
      return jsonToTypeScript(val, rootName);
    case 'python':
      return jsonToPython(val, rootName);
    case 'go':
      return jsonToGo(val, rootName);
    case 'csharp':
      return jsonToCSharp(val, rootName);
    case 'java':
      return jsonToJava(val, rootName);
    case 'kotlin':
      return jsonToKotlin(val, rootName);
    case 'swift':
      return jsonToSwift(val, rootName);
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

/**
 * Recursively sorts keys of an object alphabetically.
 */
export function sortJson(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortJson);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj)
      .sort()
      .reduce((result: any, key: string) => {
        result[key] = sortJson(obj[key]);
        return result;
      }, {});
  }
  return obj;
}

