import { loadContent } from '../utils.js';

export async function* help() {
    try {
        yield* loadContent('config/help.txt');
    } catch (error) {
        console.error('Error loading help:', error);
        yield 'Error loading help content. Please try again.';
    }
} 