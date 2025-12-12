/**
 * Formats a string by replacing placeholders with provided arguments.
 * Placeholders are in the format {index}, where index is the zero-based position of the argument.
 */
export function format(template: string, ...args: any[]): string {
  return template.replace(/{(\d+)}/g, (match, index) => {
    return args[index] !== undefined ? args[index] : match;
  });
}
