import { getCurrentDirectory } from '../fileSystem.js';
import { loadContent } from '../utils.js';

export async function cat(args, currentPath) {
    if (!args) {
        return 'Usage: cat <filename>';
    }

    const currentDir = getCurrentDirectory(currentPath);
    if (currentDir[args] && currentDir[args].type === 'file') {
        return await loadContent(currentDir[args].content);
    }
    return `cat: ${args}: No such file`;
} 