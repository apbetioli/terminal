import { getCurrentDirectory } from '../fileSystem.js';
import { loadContent } from '../utils.js';

export async function cat(args, currentPath) {
    if (!args) {
        return 'Usage: cat <filename>';
    }

    const currentDir = getCurrentDirectory(currentPath);
    if (currentDir[args] && currentDir[args].type === 'file') {
        const content = await loadContent(currentDir[args].content);
        if (args === 'contact.txt') {
            return {
                content,
                isHTML: true
            };
        }
        return content;
    }
    return `cat: ${args}: No such file`;
} 