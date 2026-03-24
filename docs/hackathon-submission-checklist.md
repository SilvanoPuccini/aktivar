# AKTIVAR — Checklist de cierre final (Hackatón CubePath 2026)

Fecha objetivo de entrega: **31 de marzo de 2026, 23:59:59 (CET)**.

## 1) Producto funcional (bloqueante)
- [ ] Registro/login funcionando en producción.
- [ ] Crear actividad + unirse actividad funcionando.
- [ ] Chat en actividad disponible.
- [ ] Flujo de pago principal validado (si aplica demo/sandbox).
- [ ] Mapa / exploración carga sin errores críticos.

## 2) Deploy y operación en CubePath/Dokploy
- [ ] Proyecto desplegado en CubePath con URL pública accesible.
- [ ] Dominio configurado y resolviendo correctamente.
- [ ] Variables críticas configuradas (`SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`).
- [ ] `DEBUG=False` confirmado en runtime.
- [ ] Logs revisados sin errores críticos en backend/frontend.

## 3) Seguridad mínima de entrega
- [ ] Cookies seguras en producción (`Secure`, `HttpOnly`, `SameSite`).
- [ ] HTTPS activo (si el dominio lo permite).
- [ ] Webhooks (Stripe) con firma verificada.
- [ ] Rate limiting en endpoints sensibles activo.
- [ ] CORS restringido a orígenes reales del frontend.

## 4) QA rápida antes de registrar la issue
- [ ] `npm run lint`
- [ ] `npm run test -- --run`
- [ ] `npm run build`
- [ ] `pytest -q`
- [ ] `bash scripts/smoke_tests.sh https://TU_DOMINIO`

## 5) Entrega en repositorio (reglas de hackatón)
- [ ] README con:
  - [ ] descripción del proyecto
  - [ ] link a demo desplegada en CubePath
  - [ ] capturas/GIFs
  - [ ] explicación de uso de CubePath
- [ ] Repositorio público.
- [ ] Proyecto registrado vía issue con plantilla oficial en `midudev/hackaton-cubepath-2026`.

## 6) Material para maximizar puntuación del jurado
- [ ] Video corto (30-90s) mostrando caso real de uso.
- [ ] Resaltar UX diferencial (diseño editorial outdoor + rapidez).
- [ ] Explicar claramente utilidad real y creatividad del producto.
