#!/usr/bin/env node

const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");
const { version } = require("os");
const { object } = require("zod");

// Get the project name from command-line arguments or use a default name
const projectName = process.argv[2] || "my-app";

// Set the URL of the GitHub repository
const repoUrl = "https://github.com/js-code-crafter/codeweaver.git";

// Clone the repository into the specified project name
exec(`git clone ${repoUrl} ${projectName}`, (error) => {
  if (error) {
    console.error(`Error cloning repository: ${error.message}`);
    return;
  }

  // Path to the cloned package.json file
  const packageJsonPath = path.join(projectName, "package.json");

  // Update the package.json file
  fs.readFile(packageJsonPath, "utf8", (readError, data) => {
    if (readError) {
      console.error(`Error reading package.json: ${readError.message}`);
      return;
    }

    // Parse the package.json content and update the name
    const { bin, ...packageJson } = JSON.parse(data);

    Object.assign(packageJson, {
      name: projectName,
      version: "1.0.0",
      description: "",
      keywords: "",
      author: "",
      license: "",
    });

    // Write the updated package.json back to the file
    fs.writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2),
      (writeError) => {
        if (writeError) {
          console.error(`Error writing package.json: ${writeError.message}`);
          return;
        }

        // Remove the command.js file
        exec(`rm -f ${path.join(projectName, "command.js")}`, (rmError) => {
          if (rmError) {
            console.error(`Error removing command.js file: ${rmError.message}`);
            return;
          }

          // Remove the .git folder
          exec(`rm -rf ${path.join(projectName, ".git")}`, (rm2Error) => {
            if (rm2Error) {
              console.error(`Error removing .git folder: ${rm2Error.message}`);
              return;
            }

            console.log(
              `Successfully cloned codeweaver into ${path.resolve(projectName)}`
            );
          });
        });
      }
    );
  });
});
