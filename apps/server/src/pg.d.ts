/**
 * Declaración mínima del paquete `pg` (driver PostgreSQL).
 * Se usa únicamente en main.ts para crear la base `sistema_canchas` en el arranque.
 * La versión instalada no expone sus propios tipos a TypeScript.
 */
declare module 'pg' {
  export class Client {
    constructor(config?: Record<string, unknown>);
    connect(): Promise<void>;
    query(text: string, values?: unknown[]): Promise<{ rowCount: number }>;
    end(): Promise<void>;
  }
}