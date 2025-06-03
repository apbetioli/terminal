// Import utilities at the top level
import { loadContent } from './utils.js';
import { getCurrentDirectory, getDirectoryFromPath } from './fileSystem.js';

document.addEventListener('DOMContentLoaded', async () => {
    const commandInput = document.getElementById('commandInput');
    const output = document.getElementById('output');

    // Import commands
    const { ls } = await import('./commands/ls.js');
    const { cd } = await import('./commands/cd.js');
    const { cat } = await import('./commands/cat.js');
    const { help } = await import('./commands/help.js');
    const { clear } = await import('./commands/clear.js');
    const { matrix } = await import('./commands/matrix.js');
    
    let currentPath = [];

    // Available commands (visible in tab completion)
    const visibleCommands = ['ls', 'cd', 'cat', 'help', 'clear'];
    
    // All commands (including hidden ones)
    const allCommands = [...visibleCommands, 'matrix'];

    // Command handlers
    const commands = {
        ls: (args) => ls(args, currentPath),
        cd: (args) => cd(args, currentPath),
        cat: async (args) => cat(args, currentPath),
        help: async () => help(),
        clear: () => clear(output),
        matrix: () => matrix(output)
    };

    // Format current path
    function getPromptPath() {
        return '/' + currentPath.join('/') + ' $';
    }

    // Tab completion function
    function getCompletions(input) {
        const parts = input.split(' ');
        const lastPart = parts[parts.length - 1].toLowerCase();
        
        // If this is the first word, complete only visible commands
        if (parts.length === 1) {
            return visibleCommands.filter(cmd => 
                cmd.toLowerCase().startsWith(lastPart)
            );
        }

        // For subsequent words, complete file/directory names
        const command = parts[0].toLowerCase();
        if (['cd', 'cat', 'ls'].includes(command)) {
            // Handle path completion
            const pathParts = lastPart.split('/');
            const partialName = pathParts.pop(); // Get the last part of the path
            let currentDir = getCurrentDirectory(currentPath);
            
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

    // Update input prompt
    function updateInputPrompt() {
        const promptSpan = document.querySelector('.input-line .prompt');
        promptSpan.textContent = getPromptPath();
    }

    // Display welcome message on load
    try {
        const welcomeMessage = await loadContent('config/welcome.txt');
        addToOutput(welcomeMessage);
        updateInputPrompt();
    } catch (error) {
        console.error('Error loading welcome message:', error);
        addToOutput('Welcome to the Terminal Portfolio!\nType \'help\' for available commands.');
        updateInputPrompt();
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

            if (allCommands.includes(command) && command in commands) {
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