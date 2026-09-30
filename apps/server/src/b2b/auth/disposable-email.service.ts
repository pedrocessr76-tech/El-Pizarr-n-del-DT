import { Injectable } from '@nestjs/common';

/**
 * Dominios de correo desechable (#verificacion-de-email).
 *
 * Bloquearlos no es antispam: sin verificación de email, un tempmail deja que
 * cualquiera se registre con una dirección que no controla y bloquee el
 * teléfono real de otra persona. Es el mismo problema que quema el WhatsApp de
 * un usuario.
 *
 * La lista por defecto es corta a propósito. Es un filtro, no una garantía: un
 * dominio nuevo aparece todo el tiempo, y ampliar la lista a ciegas produce
 * falsos positivos sobre dominios legítimos mucho más seguido de lo que frena
 * el abuso.
 */
const DEFAULT_DISPOSABLE_DOMAINS = [
  '10minutemail.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'mailinator.com',
  'maildrop.cc',
  'sharklasers.com',
  'temp-mail.org',
  'tempmail.com',
  'trashmail.com',
  'yopmail.com',
];

@Injectable()
export class DisposableEmailService {
  /**
   * Dominiosiar: lista propia si viene por env, si no la de por defecto.
   * `B2B_DISPOSABLE_EMAIL_DOMAINS` acepta coma y los modos habituales de
   * limpiar: mayúsculas, espacios y entradas vacías se descartan al cargar, así
   * que una lista vacía explícita significa "sin bloqueo" y no "bloquear todo".
   */
  private readonly blocked: Set<string>;

  /**
   * `rawList` llega por factory en el módulo (ver `B2bAuthModule`), no por tipo:
   * un parámetro con valor por defecto se emite como `Object` en los metadatos
   * de diseño y Nest lo intentaría resolver como si fuera un provider.
   */
  constructor(rawList?: string) {
    const configured = rawList
      ?.split(',')
      .map((domain) => domain.trim().toLowerCase().replace(/^[@.]+/, ''))
      .filter(Boolean);
    this.blocked = new Set(configured && configured.length > 0 ? configured : DEFAULT_DISPOSABLE_DOMAINS);
  }

  isDisposable(email: string): boolean {
    return this.blocked.has(this.domainOf(email));
  }

  /** Todo lo que va después de la última arroba, en minúsculas. */
  private domainOf(email: string): string {
    const at = email.lastIndexOf('@');
    return at < 0 ? '' : email.slice(at + 1).trim().toLowerCase();
  }

  /** Exponer la lista sería un mapa gratis para los atacantes. */
  get size(): number {
    return this.blocked.size;
  }
}