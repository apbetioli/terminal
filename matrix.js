export function setupMatrix() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let animationId;
    let fontSize = 14;
    
    // Matrix characters
    const chars = 'ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ0123456789'.split('');
    const drops = [];

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
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // Initialize drops
            const columns = Math.ceil(canvas.width / fontSize);
            while (drops.length < columns) {
                drops.push(0);
            }
        }

        resize();
        window.addEventListener('resize', resize);

        ctx.font = fontSize + 'px monospace';
        return canvas;
    }

    function drawMatrix() {
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
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }

            drops[i]++;
        }

        animationId = requestAnimationFrame(drawMatrix);
    }

    function startMatrix() {
        const canvas = initMatrix();
        drawMatrix();

        // Stop animation and return to terminal on any key press
        const cleanup = () => {
            cancelAnimationFrame(animationId);
            document.body.removeChild(canvas);
            document.removeEventListener('keydown', cleanup);
            commandInput.focus();
        };

        document.addEventListener('keydown', cleanup);
    }

    return startMatrix;
} 