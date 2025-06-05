import { getCurrentDirectory, getDirectoryFromPath } from '../fileSystem.js';
import { loadContent } from '../utils.js';

export async function* cat(args, currentPath) {
    if (!args) {
        yield 'Usage: cat <filepath>';
        return;
    }

    const pathParts = args.split('/').filter(part => part !== ''); // Filter out empty parts from leading/trailing/multiple slashes
    if (pathParts.length === 0) {
        yield 'Usage: cat <filepath>';
        return;
    }

    const fileName = pathParts.pop(); // Last part is the filename
    const directoryPathParts = pathParts; // Remaining parts form the directory path

    let targetDir;
    if (directoryPathParts.length === 0) {
        // If no path is specified, use the current directory
        targetDir = getCurrentDirectory(currentPath);
    } else {
        // Attempt to navigate to the specified directory
        // We need the root of the file system to start navigating from for getDirectoryFromPath
        // Assuming fileSystem.js exports the root or getDirectoryFromPath can handle currentPath context
        // For now, let's refine this. We need to get the root of the filesystem.
        // Let's assume getDirectoryFromPath can take currentPath and relative directoryPathParts
        // Or, more robustly, we need a function that takes the *full current directory object*
        // and relative path parts to find a sub-directory.

        // Re-evaluating: getCurrentDirectory gives us the *contents* of the current path.
        // We need to navigate *from* this current directory object.

        let tempCurrentDirObject = getCurrentDirectory(currentPath);
        let pathValid = true;

        for (const part of directoryPathParts) {
            if (tempCurrentDirObject && tempCurrentDirObject[part] && tempCurrentDirObject[part].type === 'directory') {
                tempCurrentDirObject = tempCurrentDirObject[part].contents;
            } else {
                pathValid = false;
                break;
            }
        }

        if (!pathValid) {
            yield `cat: ${args}: No such file or directory`;
            return;
        }
        targetDir = tempCurrentDirObject;
    }

    if (targetDir && targetDir[fileName] && targetDir[fileName].type === 'file') {
        try {
            // Use yield* to delegate to the loadContent async generator
            yield* loadContent(targetDir[fileName].content);
        } catch (error) {
            console.error(`Error streaming content for ${args}:`, error);
            yield `cat: ${args}: Error streaming file content`;
        }
    } else if (targetDir && targetDir[fileName] && targetDir[fileName].type === 'directory') {
        yield `cat: ${args}: Is a directory`;
    } else {
        yield `cat: ${args}: No such file`;
    }
} 