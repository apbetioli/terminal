import { getCurrentDirectory } from '../fileSystem.js';

export function cd(args, currentPath) {
    if (!args) {
        return 'Usage: cd <directory>';
    }

    if (args === '..') {
        if (currentPath.length > 0) {
            currentPath.pop();
            return '';
        }
        return 'Already at root directory';
    }

    const currentDir = getCurrentDirectory(currentPath);
    if (currentDir[args] && currentDir[args].type === 'directory') {
        currentPath.push(args);
        return '';
    }
    return `cd: ${args}: No such directory`;
} 