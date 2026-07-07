# 🤟 Voz y Texto a Señas

Aplicación web hecha con **React + Vite** que convierte **lenguaje normal (texto o
voz en español) en lengua de señas**, deletreando el mensaje con el **abecedario
dactilológico español** (27 letras, con Ñ) letra por letra.

> ✅ **Sin claves de API, sin registro y sin backend.** Las imágenes de las señas
> van empaquetadas en la app (dominio público) y el dictado por voz usa la API de
> voz integrada en el navegador. Funciona offline (la voz necesita Chrome/Edge).

## ✨ Funcionalidades

- **🔤 Traductor** — Escribe un texto **o díctalo por voz** (🎤, en español) y la
  app lo reproduce en señas, animando cada letra. Incluye controles de
  reproducir/pausa, anterior/siguiente, velocidad (Lento/Normal/Rápido) y una
  tira con la palabra donde puedes saltar a cualquier letra.
- **🅰️ Abecedario** — Referencia visual de las 27 señas dactilológicas
  españolas, incluida la **Ñ** (como la N, con un movimiento lateral). Las
  tildes no se signan (Á→A) y LL/RR/CH se deletrean con sus letras.

> Las imágenes son el **alfabeto manual de una mano** (dominio público), la base
> del dactilológico español; la Ñ se indica con la N más su movimiento (tilde
> animada).

## 🤔 ¿Por qué deletreo y no un avatar que firma frases?

Se investigaron las opciones de "texto/voz → señas":

- **[Sign-Speak](https://sign-speak.com)** (avatar que firma): su API está **detrás
  de su equipo de ventas** (no es autoservicio) y solo atiende países que usan ASL.
- **[sign.mt](https://sign.mt)** (open-source, referente): se **movió a un
  *research preview* no público** y sin español.

No hay hoy una API **gratuita y estable** de avatar de señas. El **deletreo
dactilológico** es la solución fiable, offline y educativa: sirve para cualquier
palabra o nombre y es la base real con la que se enseña a comunicarse por señas.

## 👤 Usuarios y CRUD (Local Storage)

La app incluye **inicio de sesión** y un módulo de **gestión de usuarios** con
CRUD completo persistido en `localStorage`:

- **Cuenta demo:** usuario `test` · contraseña `test123` (se crea sola al
  primer arranque).
- **Create / Read / Update / Delete** de usuarios en la pestaña **Usuarios**,
  con validaciones (usuario 3-20 caracteres sin espacios, contraseña mínima de
  6, sin duplicados) y confirmación en dos pasos para eliminar.
- **Seguridad:** las contraseñas nunca se guardan en texto plano — se almacena
  un hash **SHA-256 con salt aleatorio** por usuario (Web Crypto API). La
  sesión guarda solo datos no sensibles. Los datos corruptos en localStorage
  se descartan con un valor por defecto (integridad).
- Código: [`src/lib/storage.js`](src/lib/storage.js) (acceso seguro a
  localStorage), [`src/lib/users.js`](src/lib/users.js) (CRUD + hash + validación),
  [`src/components/UsersMode.jsx`](src/components/UsersMode.jsx) (interfaz) y
  [`src/components/LoginForm.jsx`](src/components/LoginForm.jsx).

## 🚀 Puesta en marcha

```bash
npm install
npm run dev
```

Abre <http://localhost:5173>. Escribe algo y pulsa **Signar**, o pulsa **🎤 Voz**
y habla (concede permiso de micrófono; el dictado funciona en Chrome/Edge).

## 🧩 Cómo funciona por dentro

| Pieza | Qué hace |
| --- | --- |
| [`lib/alphabet.js`](src/lib/alphabet.js) | Empaqueta los 26 SVG y convierte texto → secuencia de señas (quita acentos, `ñ`→`n`). |
| [`lib/useSpeechToText.js`](src/lib/useSpeechToText.js) | Dictado por voz con la Web Speech API (gratis, en el navegador). |
| [`components/SignPlayer.jsx`](src/components/SignPlayer.jsx) | Reproduce el deletreo letra por letra con controles. |
| [`components/TranslatorMode.jsx`](src/components/TranslatorMode.jsx) | Entrada de texto/voz. |
| [`components/AlphabetMode.jsx`](src/components/AlphabetMode.jsx) | Referencia del abecedario. |
| [`assets/asl/`](src/assets/asl/) | 26 señas en SVG (dominio público). |

## 📦 Scripts

- `npm run dev` — servidor de desarrollo.
- `npm run build` — build de producción en `dist/`.
- `npm run preview` — sirve el build de producción.

## 🔭 Cómo ampliarlo

- **Señas de palabras completas**: añadir un diccionario `palabra → GIF/vídeo`
  (p. ej. saludos comunes) y usar el deletreo solo como *fallback* para lo que no
  esté en el diccionario. Es justo como funcionan los traductores de señas serios.
- **Lengua de Señas Española (LSE/LSM)**: sustituir el set de imágenes por el
  abecedario dactilológico español y añadir `ñ`, `ll`, etc.
- **Avatar 3D**: si en el futuro consigues acceso a Sign-Speak o a otra API de
  producción, el reproductor se puede cambiar por un `<video>` del avatar.

## 📄 Créditos

Señas del abecedario: **wpclipart.com** (dominio público), vía
[Wikimedia Commons — Categoría “ASL letters”](https://commons.wikimedia.org/wiki/Category:ASL_letters).
