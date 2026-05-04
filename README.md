# CotiGen 📝

CotiGen es una aplicación web progresiva (PWA) diseñada para profesionales independientes (plomeros, electricistas, contratistas) que necesitan generar **listas de materiales** y **cotizaciones formales en PDF** de manera rápida, moderna y desde cualquier dispositivo.

## 🚀 Características Principales

- **Listas de Materiales:** Crea, guarda y edita listas de materiales requeridos para una obra.
- **Catálogo Inteligente:** Agrega materiales de un catálogo base o añade los tuyos propios con autocompletado rápido.
- **Modo Revisión (Checklist):** Una vista dedicada para ir marcando los materiales conforme llegan a la obra.
- **Cotizaciones Profesionales:** Genera cotizaciones en PDF con cálculos automáticos (subtotales, totales) y diseños personalizables.
- **Generación de PDF:** Motor interno con Puppeteer para generar PDFs pixel-perfect.
- **PWA Ready:** Instalable como aplicación nativa en iOS y Android para uso offline y acceso rápido.

## 🛠 Tecnologías Utilizadas

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Base de Datos / Backend:** [Supabase](https://supabase.com/)
- **Animaciones:** Framer Motion
- **Iconos:** Lucide React
- **Generación de PDF:** Puppeteer / Puppeteer-Core

---

## 💻 Requisitos Previos

Para ejecutar este proyecto en tu computadora local, necesitarás tener instalado:

1. **Node.js** (v18.0.0 o superior)
2. **NPM** o **Yarn**
3. Una cuenta y un proyecto en **Supabase**.

## ⚙️ Configuración del Entorno (Variables)

1. Crea un archivo llamado `.env.local` en la raíz del proyecto.
2. Añade las siguientes variables de entorno que obtendrás desde la configuración de tu proyecto en Supabase (Project Settings > API):

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

## 📦 Instalación y Ejecución Local

1. **Clona el repositorio** o descarga el código fuente:
   ```bash
   git clone https://github.com/tu-usuario/cotigen.git
   cd Cotizaciones
   ```

2. **Instala las dependencias**:
   ```bash
   npm install
   ```

3. **Inicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

4. Abre tu navegador y dirígete a [http://localhost:3000](http://localhost:3000).

## 🗄 Estructura de la Base de Datos (Supabase)

El proyecto requiere las siguientes tablas en Supabase con RLS (Row Level Security) activado:

1. **`users`** (vinculada a Supabase Auth para perfiles de usuario).
2. **`listas`** (Almacena las listas de materiales creadas).
3. **`lista_items`** (Almacena los conceptos/materiales dentro de cada lista).
4. **`catalog`** (Catálogo de materiales por defecto y personalizados).

## 🏗 Construcción para Producción

Para compilar la aplicación para producción (por ejemplo en Vercel):

```bash
npm run build
npm start
```

*Nota sobre la generación de PDF en Vercel:* El proyecto utiliza `@sparticuz/chromium` para evitar superar los límites de tamaño de las Serverless Functions en producción. Todo está configurado automáticamente en los archivos `src/lib/pdf.ts`.

## 📄 Licencia

Este proyecto es de uso privado / MIT (Ajustar según sea necesario).
