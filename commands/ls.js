import { getCurrentDirectory, getDirectoryFromPath } from '../fileSystem.js';

export function ls(args, currentPath) {
    try {
        const dir = getDirectoryFromPath(args, currentPath);
        const items = Object.entries(dir).map(([name, item]) => {
            if (item.type === 'directory') {
                return name + '/';
            }
            return name;
        });
        return items.join('\n');
    } catch (error) {
        return error.message;
    }
} 