# AKTIVAR — Auditoría técnica y plan de ejecución (Mar 24, 2026)

Este documento resume la revisión del roadmap (`docs/aktivar-master-roadmap.html`) y del diseño base de Stitch (`docs/stitch/*`), junto con mejoras priorizadas para competir en la hackatón de CubePath.

## 1) Mejoras de diseño y UX/UI propuestas

### Alta prioridad (impacto directo en evaluación de UX)
- **Home feed con jerarquía editorial real:** destacar una actividad “hero” + bloques por afinidad (hiking, trail, bike) en lugar de lista plana.
- **Estados vacíos más útiles:** CTA contextual por módulo (“Crear actividad”, “Buscar transporte”).
- **Consistencia visual de “Modern Pathfinder”:**
  - usar más contraste tonal (`surface`, `surface-container-low`, `surface-container`);
  - reducir líneas divisorias;
  - reforzar tipografía de datos con `Space Grotesk`.
- **Microinteracciones críticas:** skeletons en carga, confirmaciones visibles al unirse/pagar, animación suave en chip filters.

### Media prioridad
- **Sistema de espaciado uniforme** para tarjetas y metadata pods.
- **Mejora de accesibilidad:** foco visible en teclado, labels explícitos, contraste AA en chips de estado.

## 2) Bugs y procesos corregidos en este ciclo

- **Suite de frontend corregida para Vitest:**
  - los tests unitarios de componentes fallaban por `React is not defined` y se normalizó import explícito en los tests afectados.
  - Vitest estaba intentando ejecutar tests E2E de Playwright (`e2e/**`), provocando fallos de runner; se acotó el scope de tests unitarios a `src/**/*`.
- **Pipeline de tests backend más portable:**
  - se creó `settings_test.py` para ejecutar en SQLite/in-memory sin dependencia de GDAL/PostGIS ni servicios externos.
  - `pytest.ini` ahora usa `aktivar.settings_test`.

## 3) Seguridad: revisión y mejoras aplicadas

### Hallazgos importantes
- En entornos productivos/proxy reverso, faltaban cabeceras/políticas adicionales para endurecer sesión y tránsito.
- Los tests podían depender de servicios externos por configuración base.

### Hardening aplicado
- `settings_prod.py`:
  - `SESSION_COOKIE_HTTPONLY = True`
  - `CSRF_COOKIE_HTTPONLY = True`
  - `SESSION_COOKIE_SAMESITE = "Lax"`
  - `CSRF_COOKIE_SAMESITE = "Lax"`
  - `SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"`
  - `SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")`

## 4) Testing funcionalidad y calidad

### Ejecutado en este ciclo
- Frontend lint/build/test.
- Backend test bootstrap (bloqueado inicialmente por GDAL al usar settings base; corregido con settings de test).

### Siguiente iteración recomendada
- Agregar smoke E2E real contra staging (login, feed, join activity, chat, pago).
- Añadir cobertura mínima por módulo crítico:
  - auth + onboarding
  - booking/join
  - pagos (webhooks idempotentes)
  - SOS/alertas

## 5) Deploy (CubePath + Dokploy) checklist para hackatón

- **Producción:**
  - `DEBUG=False`
  - `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, `CORS_ALLOWED_ORIGINS` con dominio real.
  - SSL en dominio principal y redirección 80→443.
- **Operación:**
  - healthchecks (`/health`) para backend/nginx en Dokploy.
  - backups automáticos de Postgres.
  - rotación de logs + alertas (Sentry + uptime monitor).
- **Entrega hackatón (regla de documentación):**
  - README con demo pública, capturas/GIF, arquitectura, y explicación explícita de uso de CubePath.

## 6) Plan de 7 días para “proyecto ganador”

1. **Día 1-2:** cerrar bugs funcionales (auth/feed/join/chat/pago) + test smoke E2E.
2. **Día 3-4:** pulir UX principal (feed hero, filtros, activity detail, onboarding).
3. **Día 5:** performance + seguridad (headers, caching, imágenes, observabilidad).
4. **Día 6:** QA final en VPS real + fix de regresiones.
5. **Día 7:** documentación final + issue de registro en repo de hackatón.
