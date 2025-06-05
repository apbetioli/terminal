export async function matrix(output) {
    const commandInput = document.getElementById('commandInput');
    const promptPrefix = document.getElementById('promptPrefix'); // Get prompt prefix

    // Attempt to hide parent container first
    if (commandInput && commandInput.parentNode instanceof HTMLElement) {
        commandInput.parentNode.style.display = 'none';
    }
    // Also hide individual elements directly
    if (commandInput) commandInput.style.display = 'none';
    if (promptPrefix) promptPrefix.style.display = 'none'; // Hide prompt prefix

    output.innerHTML = ''; // Clears screen for intro

    const introLines = [
        "Wake up, Neo...",
        "The Matrix has you...",
        "Follow the white rabbit.",
        "", // Represents the blank line
        "Knock, knock, Neo."
    ];

    const charTypingDelay = 60; // ms per character
    const interLineDelay = 700; // ms between lines
    const postIntroDelay = 1000; // ms after all intro text, before matrix starts

    // Helper function to type a single line
    async function typeLine(lineContent, targetElement) {
        for (let i = 0; i < lineContent.length; i++) {
            targetElement.innerHTML += lineContent[i];
            await new Promise(resolve => setTimeout(resolve, charTypingDelay));
        }
    }

    // Display intro sequence
    for (const line of introLines) {
        if (line === "") {
            output.innerHTML += '<br>'; // Add an extra line break for the empty line
        } else {
            await typeLine(line, output);
            output.innerHTML += '<br>';   // Add line break after the typed line
        }
        
        // Pause after each line
        await new Promise(resolve => setTimeout(resolve, interLineDelay));
    }

    // Additional pause after the entire intro is done
    await new Promise(resolve => setTimeout(resolve, postIntroDelay));

    // Start the actual matrix animation
    const startActualMatrixAnimation = setupMatrix(output);
    startActualMatrixAnimation();

    return '';
}

function setupMatrix(output) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let animationId;
    let lastTime = 0;
    const frameRate = 60; // Target 60 FPS
    const frameDelay = 1000 / frameRate; // Time between frames in ms
    
    // Matrix characters
    const chars = 'ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ0123456789'.split('');
    const drops = [];
    
    // Calculate fontSize based on viewport height
    const calculateFontSize = () => Math.floor(window.innerHeight / 50);
    let fontSize = calculateFontSize();

    function initMatrix() {
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '1000';
        canvas.style.background = '#000';
        document.body.appendChild(canvas);

        // Set actual canvas size
        function resize() {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            fontSize = calculateFontSize();
            ctx.scale(dpr, dpr);
            
            // Initialize drops
            const columns = Math.ceil(window.innerWidth / fontSize);
            drops.length = 0; // Clear existing drops
            for (let i = 0; i < columns; i++) {
                drops.push(0);
            }
        }

        resize();
        window.addEventListener('resize', resize);

        ctx.font = fontSize + 'px monospace';
        return canvas;
    }

    function drawMatrix(currentTime) {
        // Control frame rate
        if (currentTime - lastTime < frameDelay) {
            animationId = requestAnimationFrame(drawMatrix);
            return;
        }
        lastTime = currentTime;

        // Semi-transparent black to create fade effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#0F0';
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
            // Random character
            const char = chars[Math.floor(Math.random() * chars.length)];
            
            // Draw the character
            ctx.fillText(char, i * fontSize, drops[i] * fontSize);

            // Reset drop if it's at the bottom or randomly
            if (drops[i] * fontSize > window.innerHeight && Math.random() > 0.975) {
                drops[i] = 0;
            }

            drops[i]++;
        }

        animationId = requestAnimationFrame(drawMatrix);
    }

    function startMatrix() {
        const canvasElement = initMatrix();
        animationId = requestAnimationFrame(drawMatrix);

        // Stop animation and return to terminal on any key press
        const cleanup = () => {
            cancelAnimationFrame(animationId);
            document.body.removeChild(canvasElement);
            document.removeEventListener('keydown', cleanup);

            // Clear the output content
            if (output) {
                output.innerHTML = '';
            }

            // Show and focus the command input
            const localCommandInput = document.getElementById('commandInput');
            const localPromptPrefix = document.getElementById('promptPrefix'); // Get prompt prefix again

            // Restore parent container display
            if (localCommandInput && localCommandInput.parentNode instanceof HTMLElement) {
                localCommandInput.parentNode.style.display = ''; // Default display
            }
            // Also restore individual elements directly
            if (localCommandInput) localCommandInput.style.display = '';
            if (localPromptPrefix) localPromptPrefix.style.display = '';

            if (localCommandInput) {
                localCommandInput.focus();
            }
        };

        document.addEventListener('keydown', cleanup);
    }

    return startMatrix;
} 