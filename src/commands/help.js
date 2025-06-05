import { loadContent } from '../utils.js';

export async function help() {
    try {
        return await loadContent('config/help.txt');
    } catch (error) {
        console.error('Error loading help:', error);
        return 'Error loading help content. Please try again.';
    }
} 