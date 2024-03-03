declare global {
    interface Window {
        analytics: {
            register: (plugin: any) => void;
            page: () => void;
        };
    }
}

export {};
