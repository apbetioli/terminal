document.addEventListener('DOMContentLoaded', () => {
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

    // Format current path
    function getPromptPath() {
        return '/' + currentPath.join('/') + ' $';
    }

    // Command handlers
    const commands = {
        ls: () => {
            const currentDir = getCurrentDirectory();
            const items = Object.entries(currentDir).map(([name, item]) => {
                if (item.type === 'directory') {
                    return name + '/';
                }
                return name;
            });
            return items.join('\n');
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

        help: () => `Available commands:
ls - List directory contents
cd <directory> - Change directory
cd .. - Go to parent directory
cat <filename> - Display file contents
clear - Clear the screen
help - Show this help message`,

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
    addToOutput(`Welcome to the Terminal Portfolio!
Type 'help' to see available commands.

[System Ready]`);

    // Update input prompt
    function updateInputPrompt() {
        const promptSpan = document.querySelector('.input-line .prompt');
        promptSpan.textContent = getPromptPath();
    }

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