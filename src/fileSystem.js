// File system structure
export const fileSystem = {
    "about.txt": {
        "type": "file",
        "content": "content/about.txt"
    },
    "blog": {
        "type": "directory",
        "contents": {
            "terminal-design.txt": {
                "type": "file",
                "content": "content/blog/terminal-design.txt"
            },
            "user-experience.txt": {
                "type": "file",
                "content": "content/blog/user-experience.txt"
            },
            "web-development.txt": {
                "type": "file",
                "content": "content/blog/web-development.txt"
            }
        }
    },
    "contact.txt": {
        "type": "file",
        "content": "content/contact.txt"
    }
};

// Get current directory object
export function getCurrentDirectory(currentPath = []) {
    let current = fileSystem;
    for (const dir of currentPath) {
        current = current[dir].contents;
    }
    return current;
}

// Get directory contents from path
export function getDirectoryFromPath(path, currentPath = []) {
    if (!path) return getCurrentDirectory(currentPath);

    let current = getCurrentDirectory(currentPath);
    const parts = path.split('/').filter(p => p); // Remove empty parts

    for (const part of parts) {
        if (current[part] && current[part].type === 'directory') {
            current = current[part].contents;
        } else {
            throw new Error(`ls: ${path}: No such directory`);
        }
    }
    return current;
} 