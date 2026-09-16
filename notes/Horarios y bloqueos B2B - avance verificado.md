---
title: Horarios y bloqueos B2B - avance verificado
type: note
permalink: el-pizarron-del-dt/notes/horarios-y-bloqueos-b2-b-avance-verificado
---

Integrado ScheduleSettings en Configuracion: reglas de 1/2 horas, generacion hasta 31 dias y bloqueos. El servicio excluye intervalos superpuestos de disponibilidad y comprueba bloqueos al crear o reprogramar reservas. No cancela reservas existentes. Validacion: 95 tests Jest y builds cliente/servidor correctos. Tests con repositorios simulados, sin recorrido navegador/PostgreSQL en esta tanda. Pendientes: concurrencia transaccional; zona horaria de reglas depende del servidor; formularios usan zona del navegador; integrar acciones reprogramar/completar en frontend. Codegraph utilizado para mapear endpoints.

## Validación adicional con Docker

Se reconstruyeron y reiniciaron cliente y servidor, conservando las bases. El script `C:/Pedro/MetroDev/El_Pizarron_del_DT/apps/server/scripts/b2b-block-smoke-test.mjs` pasó contra API real con PostgreSQL: turno generado, bloqueo persistido, disponibilidad filtrada, HTTP 409 al reservar y cero reservas. Consulta SQL desde el host confirmó 1 bloqueo, 1 turno superpuesto y 0 reservas. Sede de prueba archivada; organización y datos permanecen para inspección. No se realizó prueba visual de navegador. Concurrencia pendiente.

Basic Memory creó esta nota; su autoactualización posterior reportó un error de ejecutable en uso. Revisar instalación antes de la próxima sesión.
