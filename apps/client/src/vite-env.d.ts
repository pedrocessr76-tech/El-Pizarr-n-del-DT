/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_URL?: string;
	readonly VITE_B2B_ENABLED?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
