import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

function figmaAssetResolver() {
    return {
        name: 'figma-asset-resolver',
        resolveId(id) {
            if (id.startsWith('figma:asset/')) {
                const filename = id.replace('figma:asset/', '');
                return path.resolve(__dirname, 'resources/js/assets', filename);
            }
        },
    };
}

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/main.tsx', 'resources/css/app.css'],
            publicDirectory: '../backend/public',
            buildDirectory: 'build',
            refresh: true,
        }),
        figmaAssetResolver(),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },
    assetsInclude: ['**/*.svg', '**/*.csv'],
    server: {
        host: '127.0.0.1',
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
