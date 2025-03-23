export const fib = (x: number): number => (x <= 1 ? x : fib(x - 1) + fib(x - 2))
