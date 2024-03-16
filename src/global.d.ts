

declare global {
    type NextFunction = (payload: any) => any;
    type Middleware = ({payload: any, next: NextFunction}) => any;
    interface Window {
        analytics: {
            register: (plugin: any) => void;
            page: () => void;
            addSourceMiddleware: (middleware: Middleware) => void;
        };
    }
}

export {};
