import { promises as fs } from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

/**
 * A union type representing valid JSON-like values.
 * - Primitives: string, number, boolean, null
 * - Objects: { [key: string]: JsonValue }
 * - Arrays: JsonValue[]
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

/**
 * Reads a file and parses its contents as JSON or YAML depending on the file extension.
 *
 * - If the extension is ".json", parses with JSON.parse.
 * - If the extension is ".yaml" or ".yml", parses with js-yaml's YAML loader.
 * - For any other extension, throws an error indicating unsupported extension.
 *
 * @template T - The expected return type (defaults to JsonValue).
 * @param {string} filePath - The path to the file to read.
 * @returns {Promise<T>} The parsed value typed as T.
 * @throws {Error} If the file cannot be read, the extension is unsupported, or parsing fails.
 *
 * Edge cases:
 * - If the YAML/JSON content does not match the requested T, a runtime cast is performed.
 * - If the file does not exist, an error is thrown by the underlying readFile call.
 */
export async function readJsonOrYaml<T = JsonValue>(
  filePath: string
): Promise<T> {
  const ext = path.extname(filePath).toLowerCase();

  try {
    const data = await fs.readFile(filePath, "utf-8");
    if (ext === ".json") {
      return JSON.parse(data) as T;
    } else if (ext === ".yaml" || ext === ".yml") {
      return yaml.load(data) as T;
    } else {
      throw new Error(
        `Unsupported file extension: ${ext}. Only .json, .yaml, .yml are supported.`
      );
    }
  } catch (err) {
    throw new Error(`Failed to read ${filePath}: ${(err as Error).message}`);
  }
}

/**
 * Serializes data to JSON or YAML and writes it to disk, based on the file extension.
 *
 * - If the extension is ".json", the data is serialized with JSON.stringify (pretty-printed with 2 spaces).
 * - If the extension is ".yaml" or ".yml", the data is serialized with js-yaml's dump.
 * - For any other extension, throws an error indicating unsupported extension.
 *
 * @template T - Type of the data to write (defaults to JsonValue).
 * @param {string} filePath - The path to write the file to.
 * @param {T} data - The data to serialize and write.
 * @returns {Promise<void>} Resolves when the write completes.
 * @throws {Error} If the extension is unsupported or the write fails.
 */
export async function writeJsonOrYaml<T = JsonValue>(
  filePath: string,
  data: T
): Promise<void> {
  const ext = path.extname(filePath).toLowerCase();

  try {
    const serialized =
      ext === ".json"
        ? JSON.stringify(data, null, 2)
        : ext === ".yaml" || ext === ".yml"
        ? yaml.dump(data)
        : null;

    if (serialized === null) {
      throw new Error(
        `Unsupported file extension: ${ext}. Only .json, .yaml, .yml are supported.`
      );
    }

    await fs.writeFile(filePath, serialized, "utf-8");
  } catch (err) {
    throw new Error(`Failed to write ${filePath}: ${(err as Error).message}`);
  }
}

/**
 * Updates a top-level key in a JSON/YAML file. If the file does not exist, starts with an empty object.
 *
 * - Loads existing data from the file (JSON or YAML) if present and valid.
 * - If the file does not exist, initializes data as an empty object.
 * - Sets data[key] = value and saves the updated object back to disk.
 * - If the existing content is not an object, it will be replaced with a new object.
 *
 * @template K extends string - The key type (string literal type or string).
 * @template V extends JsonValue - The value to assign to the key.
 * @param {string} filePath - The path to the file to update.
 * @param {K} key - The key to set on the root object.
 * @param {V} value - The value to assign to the key.
 * @returns {Promise<void>} Resolves when the update/write completes.
 * @throws {Error} If reading the file fails with an unsupported extension, or writing fails.
 *
 * Notes:
 * - This function operates at the top level only (not nested paths).
 */
export async function updateJsonOrYaml<K extends string, V extends JsonValue>(
  filePath: string,
  key: K,
  value: V
): Promise<void> {
  const ext = path.extname(filePath).toLowerCase();

  // Load existing data
  let data: any;
  try {
    if (ext === ".json" || ext === ".yaml" || ext === ".yml") {
      data = await readJsonOrYaml<any>(filePath);
    } else {
      throw new Error(`Unsupported file extension: ${ext}.`);
    }
  } catch (err) {
    // If file doesn't exist, start with an empty object
    if (
      (err as Error).message.includes("Failed to read") &&
      (await fileExists(filePath)) === false
    ) {
      data = {};
    } else {
      throw err;
    }
  }

  // Ensure we have an object to update
  if (typeof data !== "object" || data === null) {
    data = {} as Record<string, any>;
  }

  // Update the key
  data[key] = value;

  // Save back
  await writeJsonOrYaml(filePath, data);
}

/**
 * Helper to check if a file exists.
 *
 * @param {string} filePath - The path to check.
 * @returns {Promise<boolean>} True if the file exists, false otherwise.
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
