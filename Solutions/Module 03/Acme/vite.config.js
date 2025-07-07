import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {

    // This will load the environment variables from the .env file in the Vite way. Note that
    // this sees EVERYTHING in the .env file, not just the VITE_ prefixed variables. But only
    // the VITE_ prefixed variables will be available in the browser.
    let env = loadEnv(mode, process.cwd(), '')

    // We need to figure out if the configuration forces a VITE_APP_BASE_URL. If it doesn't then
    // see if this is a GitHub Codespace or not. Set the public base url accordingly.
    if (!env.VITE_APP_BASE_URL) {
        process.env.VITE_APP_BASE_URL = !env.CODESPACE_NAME
            ? `http://localhost:${env.VITE_APP_PORT}`
            : `https://${env.CODESPACE_NAME}-${env.VITE_APP_PORT}.${env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`
    }

    // Just make sure the user has the true link to open:
    console.log('The Acme Financial Management application has started, use ctrl/cmd-click to follow this link:', process.env.VITE_APP_BASE_URL)

    return {
        plugins: [
            vue(),
            vueDevTools(),
        ],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            },
        },
        server: {
            port: env.VITE_APP_PORT,
            proxy: {
                // This proxy is to bypass the CORS issues with session cookies not being passed between
                // different applications on the same domain but different ports. Vite will take care of
                // the session cookie for us, and the BFF API will work properly.
                '/bff': {
                    target: 'http://localhost:39500',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/bff/, '')
                }
            }
        }
    }
})