#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
// Script is in project_root/scripts/updateFileSystem.mjs
// Content is in project_root/src/content/
// Target JS file is project_root/src/fileSystem.js
const contentBaseDirOnDisk = path.join(__dirname, '..', 'src', 'content');
const targetJsFile = path.join(__dirname, '..', 'src', 'fileSystem.js');
const contentFieldPrefix = 'content'; // Path prefix for the 'content' field in the fileSystem object

/**
 * Recursively generates the file system structure from disk.
 * @param {string} currentPathOnDisk - The current directory path on disk to scan.
 * @param {string} pathPrefixForContentField - The prefix for the 'content' attribute in the output structure.
 * @returns {object} - The file system structure.
 */
function generateFileSystemStructure(currentPathOnDisk, pathPrefixForContentField) {
    const structure = {};
    try {
        const entries = fs.readdirSync(currentPathOnDisk).filter(entry => !entry.startsWith('.')); // Filter out hidden files

        for (const entryName of entries) {
            const entryPathOnDisk = path.join(currentPathOnDisk, entryName);
            const stat = fs.statSync(entryPathOnDisk);
            // Ensure forward slashes for consistency in the 'content' path
            const contentPath = path.join(pathPrefixForContentField, entryName).replace(/\\\\/g, '/');

            if (stat.isFile()) {
                structure[entryName] = {
                    type: 'file',
                    content: contentPath
                };
            } else if (stat.isDirectory()) {
                structure[entryName] = {
                    type: 'directory',
                    contents: generateFileSystemStructure(entryPathOnDisk, contentPath)
                };
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${currentPathOnDisk}: ${error.message}`);
        // Return empty structure for this level if directory is unreadable, or re-throw
        // For now, we'll let it propagate if it's a critical error like contentBaseDirOnDisk not found
        if (currentPathOnDisk === contentBaseDirOnDisk && !fs.existsSync(contentBaseDirOnDisk)) {
            throw error; // Re-throw if the base content directory itself is missing
        }
    }
    return structure;
}

function main() {
    console.log(`Scanning content directory: ${contentBaseDirOnDisk}`);

    if (!fs.existsSync(contentBaseDirOnDisk)) {
        console.error(`Error: Content directory not found at ${contentBaseDirOnDisk}`);
        process.exit(1);
    }

    const newFileSystemObject = generateFileSystemStructure(contentBaseDirOnDisk, contentFieldPrefix);
    const newFileSystemString = JSON.stringify(newFileSystemObject, null, 4);

    console.log(`Reading target file: ${targetJsFile}`);
    let fileContent;
    try {
        fileContent = fs.readFileSync(targetJsFile, 'utf8');
    } catch (error) {
        console.error(`Error: Could not read target file ${targetJsFile}: ${error.message}`);
        process.exit(1);
    }

    const regex = /(export const fileSystem = )(\{[\s\S]*?\})(;)/m;
    const match = fileContent.match(regex);

    if (!match) {
        console.error(`Error: Could not find the 'fileSystem' object in ${targetJsFile}.`);
        console.error("Please ensure it's defined like: export const fileSystem = { ... };");
        process.exit(1);
    }
    
    const updatedFileContent = fileContent.replace(regex, `$1${newFileSystemString}$3`);

    try {
        fs.writeFileSync(targetJsFile, updatedFileContent, 'utf8');
        console.log(`Successfully updated ${targetJsFile} with the new file system structure.`);
    } catch (error) {
        console.error(`Error: Could not write to target file ${targetJsFile}: ${error.message}`);
        process.exit(1);
    }
}

main(); 