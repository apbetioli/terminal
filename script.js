document.addEventListener('DOMContentLoaded', async () => {
    const commandInput = document.getElementById('commandInput');
    const output = document.getElementById('output');

    // File system structure
    const fileSystem = {
        'about.txt': { type: 'file', content: 'content/about.txt' },
        'contact.txt': { type: 'file', content: 'content/contact.txt' },
        'blog': {
            type: 'directory',
            contents: {
                'terminal-design.txt': { type: 'file', content: 'content/blog/terminal-design.txt' },
                'web-development.txt': { type: 'file', content: 'content/blog/web-development.txt' },
                'user-experience.txt': { type: 'file', content: 'content/blog/user-experience.txt' }
            }
        }
    };

    // Available commands
    const availableCommands = ['ls', 'cd', 'cat', 'help', 'clear'];

    let currentPath = [];

    // Function to load content from text files
    async function loadContent(filename) {
        try {
            const response = await fetch(filename);
            if (!response.ok) throw new Error(`Error loading ${filename}`);
            return await response.text();
        } catch (error) {
            console.error(error);
            return `Error loading ${filename} content.`;
        }
    }

    // Get current directory object
    function getCurrentDirectory() {
        let current = fileSystem;
        for (const dir of currentPath) {
            current = current[dir].contents;
        }
        return current;
    }

    // Get directory contents from path
    function getDirectoryFromPath(path) {
        if (!path) return getCurrentDirectory();
        
        let current = getCurrentDirectory();
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

    // Format current path
    function getPromptPath() {
        return '/' + currentPath.join('/') + ' $';
    }

    // Tab completion function
    function getCompletions(input) {
        const parts = input.split(' ');
        const lastPart = parts[parts.length - 1].toLowerCase();
        
        // If this is the first word, complete commands
        if (parts.length === 1) {
            return availableCommands.filter(cmd => 
                cmd.toLowerCase().startsWith(lastPart)
            );
        }

        // For subsequent words, complete file/directory names
        const command = parts[0].toLowerCase();
        if (['cd', 'cat', 'ls'].includes(command)) {
            // Handle path completion
            const pathParts = lastPart.split('/');
            const partialName = pathParts.pop(); // Get the last part of the path
            let currentDir = getCurrentDirectory();
            
            // Navigate through the path parts
            for (const part of pathParts) {
                if (part === '') continue;
                const matchingDir = Object.entries(currentDir)
                    .find(([name, item]) => 
                        item.type === 'directory' && 
                        name.toLowerCase() === part.toLowerCase()
                    );
                if (matchingDir) {
                    currentDir = matchingDir[1].contents;
                } else {
                    return []; // Invalid path
                }
            }

            // Get completions in the current directory
            const names = Object.keys(currentDir);
            const matches = names.filter(name => 
                name.toLowerCase().startsWith(partialName.toLowerCase())
            );

            // Add path prefix back to matches
            const pathPrefix = pathParts.length > 0 ? pathParts.join('/') + '/' : '';
            return matches.map(match => pathPrefix + match);
        }

        return [];
    }

    // Display completions in terminal
    function displayCompletions(completions) {
        if (completions.length > 0) {
            addToOutput(completions.join('    '));
            updateInputPrompt();
        }
    }

    // Find the longest common prefix of an array of strings
    function findCommonPrefix(strings) {
        if (strings.length === 0) return '';
        if (strings.length === 1) return strings[0];

        let prefix = strings[0];
        for (let i = 1; i < strings.length; i++) {
            while (strings[i].toLowerCase().indexOf(prefix.toLowerCase()) !== 0) {
                prefix = prefix.substring(0, prefix.length - 1);
                if (prefix === '') return '';
            }
        }
        return prefix;
    }

    // Command handlers
    const commands = {
        ls: (args) => {
            try {
                const dir = getDirectoryFromPath(args);
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
        },

        cd: async (args) => {
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

            const currentDir = getCurrentDirectory();
            if (currentDir[args] && currentDir[args].type === 'directory') {
                currentPath.push(args);
                return '';
            }
            return `cd: ${args}: No such directory`;
        },

        cat: async (args) => {
            if (!args) {
                return 'Usage: cat <filename>';
            }

            const currentDir = getCurrentDirectory();
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
        },

        help: async () => {
            try {
                return await loadContent('config/help.txt');
            } catch (error) {
                console.error('Error loading help:', error);
                return 'Error loading help content. Please try again.';
            }
        },

        clear: () => {
            output.innerHTML = '';
            return '';
        }
    };

    function addToOutput(text, isCommand = false, isHTML = false) {
        const div = document.createElement('div');
        div.className = 'command-output';
        
        if (isCommand) {
            div.className += ' command-text';
            div.innerHTML = `<span class="prompt">${getPromptPath()}</span>${text}`;
        } else if (isHTML) {
            const lines = text.split('\n');
            div.innerHTML = lines.map(line => line.trim()).join('<br>');
        } else {
            div.innerText = text;
        }
        
        output.appendChild(div);
        div.scrollIntoView({ behavior: 'smooth' });
    }

    // Display welcome message on load
    try {
        const welcomeMessage = await loadContent('config/welcome.txt');
        addToOutput(welcomeMessage);
    } catch (error) {
        console.error('Error loading welcome message:', error);
        addToOutput('Welcome to the Terminal Portfolio!\nType \'help\' for available commands.');
    }

    // Update input prompt
    function updateInputPrompt() {
        const promptSpan = document.querySelector('.input-line .prompt');
        promptSpan.textContent = getPromptPath();
    }

    // Handle tab completion
    commandInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const input = commandInput.value;
            const completions = getCompletions(input);

            if (completions.length === 1) {
                // If there's only one completion, use it
                const parts = input.split(' ');
                parts[parts.length - 1] = completions[0];
                commandInput.value = parts.join(' ');
            } else if (completions.length > 1) {
                // If there are multiple completions:
                // 1. Display all possibilities
                displayCompletions(completions);
                
                // 2. Complete to the longest common prefix
                const commonPrefix = findCommonPrefix(completions);
                if (commonPrefix) {
                    const parts = input.split(' ');
                    parts[parts.length - 1] = commonPrefix;
                    commandInput.value = parts.join(' ');
                }
            }
        }
    });

    commandInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const fullCommand = commandInput.value.trim();
            const [cmd, ...args] = fullCommand.split(' ');
            const command = cmd.toLowerCase();
            
            addToOutput(fullCommand, true);
            commandInput.value = '';

            if (command in commands) {
                const result = await commands[command](args.join(' '));
                if (result) {
                    if (typeof result === 'object' && result.isHTML) {
                        addToOutput(result.content, false, true);
                    } else {
                        addToOutput(result);
                    }
                }
                updateInputPrompt();
            } else if (command !== '') {
                addToOutput(`Command not found: ${command}\nType 'help' for available commands.`);
            }
        }
    });

    // Keep focus on input
    document.addEventListener('click', () => {
        commandInput.focus();
    });
}); 