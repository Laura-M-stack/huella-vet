# Huella Vet

Demo de un sistema de gestión interna a medida para una clínica veterinaria ficticia. Sirve para mostrarle a un cliente cómo se vería un software hecho para su negocio: no es un producto a la venta.

Demo en vivo: https://laura-m-stack.github.io/huella-vet/

## Qué incluye

- Landing corta que lleva al panel.
- Panel: turnos del día, vacunas a revisar, stock crítico e ingresos.
- Pacientes: búsqueda, alta de paciente y tutor, ficha con consultas, vacunas e internación.
- Agenda: vista semanal, filtro por profesional, alta de turno con control de choques de horario y cambio de estado.
- Vacunas: refuerzos vencidos o por vencer, registro de aplicación y mensaje de aviso para el tutor.
- Insumos: stock con mínimos y vencimientos, ajuste de cantidades y alta.

## Stack

Vite 7, React 19, TypeScript estricto, CSS plano con tokens (tema claro y oscuro), `node:test` con `tsx` para la lógica. Sin backend: el estado vive en `localStorage` (clave `huella-vet:v1`).

## Scripts

```powershell
npm install
npm run dev       # servidor local
npm run check     # tsc
npm test          # tests de la lógica
npm run build     # genera dist/
```

## Estructura

- `src/lib`: lógica pura (fechas, vacunas, stock, agenda, indicadores, datos de ejemplo) con sus tests.
- `src/state`: reducer, store y tests.
- `src/components`, `src/pages`: interfaz.
- `src/styles`: tokens, base, app y landing.

## Notas

- Todos los datos son inventados. Se regeneran cada día relativos a la fecha actual, así la demo nunca queda con turnos pasados; lo que se cargue queda en el navegador hasta el día siguiente o hasta "Restaurar datos".
- El sitio se publica en GitHub Pages con `base: '/huella-vet/'` (ver `vite.config.ts`) y el workflow `.github/workflows/deploy.yml`.
- Navegación con hash (`#/app/agenda`), para que funcione en Pages sin configurar redirecciones.
