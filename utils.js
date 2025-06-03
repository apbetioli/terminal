// Function to load content from text files
export async function loadContent(filename) {
    try {
        const response = await fetch(filename);
        if (!response.ok) throw new Error(`Error loading ${filename}`);
        return await response.text();
    } catch (error) {
        console.error(error);
        return `Error loading ${filename} content.`;
    }
} 