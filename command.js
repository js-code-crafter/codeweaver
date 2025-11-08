#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { exec: _exec } = require("child_process");
const { promisify } = require("util");

const exec = promisify(_exec);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const access = promisify(fs.access);

(async () => {
  try {
    // Get the project name from command-line arguments or use a default name
    const projectName = process.argv[2] || "my-app";

    // Set the URL of the GitHub repository
    const repoUrl = "https://github.com/js-code-crafter/codeweaver.git";

    // Clone the repository into the specified project name
    await exec(`git clone ${repoUrl} ${projectName}`);
    console.log(`Cloned repository into ${projectName}`);

    // Path to the cloned package.json file
    const packageJsonPath = path.join(projectName, "package.json");

    // Ensure package.json exists before trying to read
    await access(packageJsonPath);

    // Read and parse package.json
    const data = await readFile(packageJsonPath, "utf8");
    const parsed = JSON.parse(data);

    // Remove the bin field if it exists (as in your original logic)
    const { bin, ...packageJson } = parsed;

    // Update fields as requested
    Object.assign(packageJson, {
      name: projectName,
      version: "1.0.0",
      description: "",
      keywords: "",
      author: "",
      license: "",
    });

    // Write the updated package.json back to the file
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // Remove the command.js file if it exists
    const commandJsPath = path.join(projectName, "command.js");
    try {
      await exec(`rm -f ${commandJsPath}`);
    } catch (err) {
      // If removal fails because the file doesn't exist, ignore
      // Otherwise, log the error
      if (err && err.code !== 1) {
        console.error(`Error removing command.js file: ${err.message}`);
        // Continue anyway
      }
    }

    // Remove the .git folder
    try {
      await exec(`rm -rf ${path.join(projectName, ".git")}`);
    } catch (err) {
      console.error(`Error removing .git folder: ${err.message}`);
      // continue anyway
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
})();
