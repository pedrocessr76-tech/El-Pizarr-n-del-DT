/** Token de inyección del registro de proveedores de mensajería (#34/#37). */

/**
 * Registro canal → proveedor activo. El mapa siempre contiene los canales
 * soportados, con `log` como respaldo para no romper el arranque.
 */
export const MESSAGE_PROVIDERS = Symbol('MESSAGE_PROVIDERS');
