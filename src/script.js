// Import utilities at the top level
import { loadContent } from './utils.js';
import { getCurrentDirectory, getDirectoryFromPath } from './fileSystem.js';

document.addEventListener('DOMContentLoaded', async () => {
    const commandInput = document.getElementById('commandInput');
    const output = document.getElementById('output');
    const inputLine = document.querySelector('.input-line');

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
        cat: (args) => cat(args, currentPath),
        help: () => help(),
        clear: () => clear(output),
        matrix: () => matrix(output)
    };

    // Format current path
    function getPromptPath() {
        return '/' + currentPath.join('/') + '>';
    }

    // Tab completion function
    function getCompletions(input) {
        const trimmedInput = input.trimStart();
        const leadingSpaces = input.length - trimmedInput.length;
        const parts = trimmedInput.split(' ');
        const lastPart = parts[parts.length - 1].toLowerCase();
        
        // If this is the first word, complete only visible commands
        if (parts.length === 1) {
            const completions = visibleCommands.filter(cmd => 
                cmd.toLowerCase().startsWith(lastPart)
            );
            // Preserve leading spaces in completions
            return completions.map(completion => ' '.repeat(leadingSpaces) + completion);
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
            return matches.map(match => ' '.repeat(leadingSpaces) + parts.slice(0, -1).join(' ') + ' ' + pathPrefix + match);
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

    function addToOutput(text, isCommand = false) {
        const div = document.createElement('div');
        div.className = 'command-output';
        
        if (isCommand) {
            div.className += ' command-text';
            div.innerHTML = `<span class="prompt">${getPromptPath()}</span>${text}`;
        } else {
            const lines = String(text).split('\n');
            div.innerHTML = lines.map(line => line.trim()).join('<br>');
        }
        
        output.appendChild(div);
        div.scrollIntoView({ behavior: 'smooth' });
    }

    // Update input prompt
    function updateInputPrompt() {
        addToOutput("\n")
        const promptSpan = document.querySelector('.input-line .prompt');
        promptSpan.textContent = getPromptPath();
    }

    function getLastLoginTime() {
        return localStorage.getItem('lastLoginTime');
    }

    function setLoginTime() {
        localStorage.setItem('lastLoginTime', new Date().toString());
    }

    function displayLastLogin() {
        const lastLoginTimestamp = getLastLoginTime();
        let dateToShow;

        if (lastLoginTimestamp) {
            dateToShow = new Date(lastLoginTimestamp);
        } else {
            // First visit or localStorage cleared, show current time
            dateToShow = new Date();
        }

        // Manual formatting for "Wed Jun 4 22:50:34"
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const dayOfWeek = days[dateToShow.getDay()];
        const month = months[dateToShow.getMonth()];
        const day = dateToShow.getDate();
        const hours = dateToShow.getHours().toString().padStart(2, '0');
        const minutes = dateToShow.getMinutes().toString().padStart(2, '0');
        const seconds = dateToShow.getSeconds().toString().padStart(2, '0');

        const displayString = `Last login: ${dayOfWeek} ${month} ${day} ${hours}:${minutes}:${seconds}`;
        addToOutput(displayString);

        setLoginTime(); // Update the login time for the next visit
    }

    // Handle tab completion
    commandInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const input = commandInput.value;
            const completions = getCompletions(input);

            if (completions.length === 1) {
                // If there's only one completion, use it
                commandInput.value = completions[0];
            } else if (completions.length > 1) {
                // If there are multiple completions:
                // 1. Display all possibilities
                displayCompletions(completions);
                
                // 2. Complete to the longest common prefix
                const commonPrefix = findCommonPrefix(completions);
                if (commonPrefix) {
                    commandInput.value = commonPrefix;
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

            if (inputLine) inputLine.style.display = 'none';

            try {
                if (command === '') {
                    // User pressed Enter on an empty line, do nothing here.
                    // The 'finally' block will restore the prompt.
                } else if (allCommands.includes(command) && command in commands) {
                    const commandFn = commands[command];
                    const result = commandFn(args.join(' ')); // Execute the command

                    // Check if the result is an async generator
                    if (result && typeof result[Symbol.asyncIterator] === 'function') {
                        for await (const chunk of result) {
                            if (chunk !== undefined && chunk !== null) {
                                addToOutput(String(chunk));

                                // Loading text effect
                                // await new Promise(resolve => setTimeout(resolve, 50));
                            }
                        }
                    } else {
                        // Handle synchronous commands or promises that resolve to a single value
                        const finalResult = await result; // Await if it's a promise
                        if (finalResult !== undefined && finalResult !== null) {
                            if (typeof finalResult === 'object' && finalResult.content) {
                                addToOutput(finalResult.content);
                            } else {
                                addToOutput(String(finalResult));
                            }
                        }
                    }
                } else {
                    addToOutput(`Command not found: ${command}\nType 'help' for available commands.`);
                }
            } catch (error) {
                console.error("Error executing command:", command, error);
                addToOutput(`Error executing command: ${command}`);
            } finally {
                if (inputLine) inputLine.style.display = '';
                updateInputPrompt();
                commandInput.focus();
            }
        }
    });

    // Keep focus on input
    document.addEventListener('click', () => {
        commandInput.focus();
    });


    displayLastLogin();
    updateInputPrompt();
}); 