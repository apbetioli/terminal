document.addEventListener('DOMContentLoaded', () => {
    const commandInput = document.getElementById('commandInput');
    const output = document.getElementById('output');

    // Function to load content from text files
    async function loadContent(filename) {
        try {
            const response = await fetch(`content/${filename}.txt`);
            if (!response.ok) throw new Error(`Error loading ${filename}`);
            return await response.text();
        } catch (error) {
            console.error(error);
            return `Error loading ${filename} content.`;
        }
    }

    const commands = {
        help: async () => await loadContent('help'),
        about: async () => await loadContent('about'),
        blog: async () => await loadContent('blog'),
        contact: async () => ({
            content: await loadContent('contact'),
            isHTML: true
        }),
        clear: () => {
            output.innerHTML = '';
            return '';
        },
        home: async () => await loadContent('welcome')
    };

    async function getWelcomeMessage() {
        return await loadContent('welcome');
    }

    function addToOutput(text, isCommand = false, isHTML = false) {
        const div = document.createElement('div');
        div.className = 'command-output';
        
        if (isCommand) {
            div.className += ' command-text';
            div.innerHTML = `<span class="prompt">$ </span>${text}`;
        } else if (isHTML) {
            // Convert line breaks to <br> tags while preserving HTML
            const lines = text.split('\n');
            div.innerHTML = lines.map(line => line.trim()).join('<br>');
        } else {
            div.innerText = text;
        }
        
        output.appendChild(div);
        div.scrollIntoView({ behavior: 'smooth' });
    }

    // Display welcome message on load
    getWelcomeMessage().then(message => addToOutput(message));

    commandInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const command = commandInput.value.toLowerCase().trim();
            addToOutput(command, true);
            commandInput.value = '';

            if (command in commands) {
                const result = await commands[command]();
                if (result) {
                    if (typeof result === 'object' && result.isHTML) {
                        addToOutput(result.content, false, true);
                    } else {
                        addToOutput(result);
                    }
                }
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