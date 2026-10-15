declare const React: any;
declare const ReactDOM: any;
declare const h: any;

declare function useState<T = any>(initial?: T): [T, (value: any) => void];
declare function useEffect(effect: (...args: any[]) => any, deps?: any[]): void;
declare function useRef<T = any>(initial?: T): { current: T };
declare function useMemo<T = any>(factory: () => T, deps?: any[]): T;
declare function useCallback<T = any>(fn: T, deps?: any[]): T;
