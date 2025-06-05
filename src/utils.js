// Function to load content from text files
export async function* loadContent(filename) {
    try {
        const response = await fetch(filename);
        if (!response.ok) {
            // It's better to yield an error message or throw an error that the caller can catch
            // For now, let's yield an error message that can be displayed.
            yield `Error loading ${filename}: ${response.status} ${response.statusText}`;
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                if (buffer.length > 0) {
                    yield buffer; // Yield any remaining data in the buffer
                }
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            let newlineIndex;
            while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                yield buffer.substring(0, newlineIndex);
                buffer = buffer.substring(newlineIndex + 1);
            }
        }
    } catch (error) {
        console.error(error);
        // Yield an error message that can be displayed by the terminal
        yield `Error loading ${filename} content: ${error.message}`;
    }
} 