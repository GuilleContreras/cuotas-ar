# Cuotas AR

PWA para administrar compras en cuotas de tarjetas de crédito argentinas. Funciona 100% offline, sin backend ni login: todo se guarda en tu propio celular (IndexedDB).

---

## 🚀 Cómo publicarla SIN instalar nada en tu computadora

Vas a usar GitHub (para alojar el código) + Vercel (para compilarlo y darte una URL). Los dos son gratis y todo se hace desde el navegador.

### Paso 1 — Crear cuenta en GitHub
1. Entrá a https://github.com/signup y creá una cuenta (si ya tenés, saltealo).

### Paso 2 — Crear un repositorio
1. Entrá a https://github.com/new
2. Nombre del repositorio: `cuotas-ar`
3. Dejalo en "Public" o "Private", como prefieras.
4. Click en **Create repository** (no marques ninguna casilla de "Add README").

### Paso 3 — Subir el código
1. En la página del repositorio recién creado, click en el link **"uploading an existing file"**.
2. Descomprimí el .zip que te pasé en tu computadora.
3. Arrastrá **la carpeta `cuotas-ar` completa** (con todo adentro: `src`, `public`, `package.json`, etc.) sobre el recuadro de GitHub. Si tu navegador no sube subcarpetas, arrastrá el contenido de la carpeta seleccionando todo (Ctrl+A / Cmd+A dentro de la carpeta descomprimida) y soltalo ahí — GitHub respeta la estructura de carpetas al arrastrar.
4. Esperá que termine de cargar, escribí un mensaje como "Primera versión" y click en **Commit changes**.

### Paso 4 — Deploy en Vercel
1. Entrá a https://vercel.com/signup y creá una cuenta usando **"Continue with GitHub"** (así quedan conectadas automáticamente).
2. Una vez adentro, click en **Add New... → Project**.
3. Buscá el repositorio `cuotas-ar` y click en **Import**.
4. Vercel va a detectar automáticamente que es un proyecto Next.js. No cambies nada.
5. Click en **Deploy** y esperá 1-2 minutos.
6. Cuando termine, te va a dar una URL tipo `https://cuotas-ar-tuusuario.vercel.app`. Esa es tu app, ya online y con HTTPS (necesario para que funcione como PWA).

Cada vez que quieras cambiar algo del código y volver a subirlo, lo actualizás en GitHub y Vercel la vuelve a publicar solo.

---

## 📲 Cómo instalarla en tu iPhone

1. Abrí la URL de Vercel en **Safari** (tiene que ser Safari, no Chrome, para que aparezca la opción).
2. Tocá el botón de **Compartir** (el cuadradito con la flecha hacia arriba).
3. Elegí **"Agregar a pantalla de inicio"**.
4. Confirmá el nombre ("Cuotas AR") y tocá **Agregar**.

Va a quedar como un ícono más en tu pantalla de inicio, abre sin la barra de Safari, y funciona sin internet una vez que la abriste al menos una vez.

### En Android
Abrí la URL en Chrome, tocá el menú (⋮) y elegí **"Instalar app"** (o esperá el banner automático que aparece abajo).

---

## 💻 Si en algún momento querés correrla local (opcional)

Necesitás instalar Node.js (versión 20 o superior) desde https://nodejs.org (botón LTS). Después, en una terminal dentro de la carpeta del proyecto:

```bash
npm install
npm run dev
```

Y abrís http://localhost:3000 en el navegador.

Para generar la versión de producción:

```bash
npm run build
npm run start
```

---

## 🧠 Cómo funciona la lógica de cuotas (por si querés entenderla o ajustarla)

Todo el cálculo vive en `src/lib/installments.ts`, función `generateInstallmentPlan`. La regla es:

1. Si la compra se hizo el día de cierre o antes → entra en el resumen que cierra ese mismo mes.
2. Si se hizo después del cierre → entra en el resumen que cierra el mes siguiente.
3. El vencimiento de ese resumen cae el mismo mes del cierre (si el día de vencimiento es igual o posterior al de cierre) o al mes siguiente (si el vencimiento "cruza" de mes, ej: cierre día 28, vencimiento día 5).
4. A partir de ahí, cada cuota siguiente cae un mes después.

El monto se reparte en partes iguales y la última cuota absorbe la diferencia de centavos por redondeo, para que la suma cierre siempre exacto con el total de la compra.

---

## 📁 Estructura del proyecto

```
src/
  app/                  → Pantallas (App Router de Next.js)
    page.tsx            → Dashboard
    tarjetas/            → Listado, alta y detalle de tarjetas
    compras/nueva/        → Alta de compra (con preview de cuotas)
    compras/[id]/         → Detalle de compra y cuotas
    calendario/           → Vista mensual de cuotas
    estadisticas/          → Gráficos, búsqueda y respaldo JSON
    simulador/            → "¿Me alcanza?"
  components/           → Componentes reutilizables (UI + específicos)
  hooks/                 → Acceso a la base de datos (Dexie)
  lib/
    db.ts                → Definición de IndexedDB
    installments.ts      → Motor de cálculo de cuotas
    types.ts             → Tipos de datos
    backup.ts            → Exportar/importar respaldo JSON
public/
  manifest.json          → Manifest de la PWA
  sw.js                  → Service Worker (modo offline)
  icons/                  → Íconos de la app
```

## ⚠️ Sobre los íconos

Ya incluí íconos generados automáticamente (`public/icons/`) para que la PWA sea instalable de entrada. Si más adelante querés un logo propio, reemplazá esos tres archivos PNG (192x192, 512x512 y 180x180 para iOS) manteniendo los mismos nombres.
