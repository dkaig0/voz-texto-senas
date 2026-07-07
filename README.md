# Voz y Texto a Señas

Aplicación web SPA hecha con **React + Vite** que convierte **lenguaje normal
(texto o voz en español) en lengua de señas**, deletreando el mensaje con el
**abecedario dactilológico español** (27 letras, con Ñ) letra por letra.

Proyecto de la Evaluación 3 de **Programación Front End (INACAP)**: aplicación
React con componentes reutilizables, hooks, CRUD con Local Storage, consumo de
API externa y apoyo de herramientas de IA.

> **Sin claves de API obligatorias, sin registro externo y sin backend.** Las
> imágenes de las señas van empaquetadas en la app (dominio público) y el
> dictado por voz usa la API de voz integrada en el navegador.

## Problemática y ODS

Las personas sordas y su entorno (familia, compañeros, servicios públicos)
enfrentan una barrera de comunicación diaria: la mayoría de las personas
oyentes no conoce la lengua de señas ni su abecedario. Esta app permite a
cualquier persona convertir un mensaje en su deletreo en señas y aprender el
abecedario dactilológico, como primer puente de comunicación.

- **ODS 10 — Reducción de las desigualdades**: facilita la inclusión de
  personas con discapacidad auditiva.
- **ODS 4 — Educación de calidad**: enseña el abecedario dactilológico de
  forma gratuita y accesible.

## Funcionalidades

- **Traductor** — Escribe un texto o díctalo por voz (en español) y la app lo
  reproduce en señas, animando cada letra. Controles de reproducir/pausa,
  anterior/siguiente, velocidad (Lento/Normal/Rápido) y una tira con la palabra
  para saltar a cualquier letra.
- **Abecedario** — Referencia visual de las 27 señas dactilológicas españolas,
  incluida la **Ñ** (como la N, con un movimiento lateral). Las tildes no se
  signan (Á→A) y LL/RR/CH se deletrean con sus letras.
- **Usuarios** — Inicio de sesión y CRUD completo de usuarios con Local
  Storage, contraseñas cifradas y generación de usuarios desde la API externa
  randomuser.me con fotos de perfil del set LEGO.

## Puesta en marcha

```bash
npm install
npm run dev
```

Abre <http://localhost:5173> y entra con la **cuenta demo**:

| Usuario | Contraseña |
| --- | --- |
| `test` | `test123` |

Escribe algo y pulsa **Signar**, o pulsa **Voz** y habla (concede permiso de
micrófono). Para el CRUD: pestaña **Usuarios**.

### Scripts

- `npm run dev` — servidor de desarrollo.
- `npm run build` — build de producción en `dist/`.
- `npm run preview` — sirve el build de producción.

## Estructura del proyecto

```
index.html                      Punto de entrada (Vite)
src/
  main.jsx                      Bootstrap de React
  App.jsx                       Sesión, navegación y composición de modos
  styles.css                    Estilos
  assets/asl/                   Señas del abecedario en SVG (dominio público)
  lib/
    alphabet.js                 Texto → secuencia de señas (27 letras con Ñ)
    useSpeechToText.js          Hook de dictado por voz (Web Speech API)
    storage.js                  Lectura/escritura segura de localStorage
    users.js                    CRUD de usuarios + hash SHA-256 + validaciones
    audioRecord.js              Grabación de micrófono (base para dictado local futuro)
  components/
    LoginForm.jsx               Inicio de sesión con validación
    TranslatorMode.jsx          Entrada de texto/voz
    SignPlayer.jsx              Reproductor del deletreo con controles
    AlphabetMode.jsx            Referencia del abecedario
    UsersMode.jsx               CRUD de usuarios + consumo de randomuser.me
```

## Usuarios y CRUD (Local Storage)

- **Create / Read / Update / Delete** de usuarios en la pestaña **Usuarios**,
  con validaciones (usuario 3-20 caracteres sin espacios, contraseña mínima de
  6, sin duplicados) y confirmación en dos pasos para eliminar. No puedes
  eliminar el usuario de tu propia sesión.
- **Persistencia**: claves `senas.usuarios` (lista de usuarios) y
  `senas.sesion` (sesión activa) en localStorage. Los datos se recuperan al
  cargar la app; si el JSON está corrupto o con estructura inválida se descarta
  y se usa un valor por defecto (integridad de datos).
- **Seguridad**: las contraseñas nunca se guardan en texto plano — se almacena
  un hash **SHA-256 con salt aleatorio por usuario** (Web Crypto API). La
  sesión guarda solo datos no sensibles (id, usuario, nombre). El login
  recalcula el hash con el salt guardado y lo compara.
- La cuenta demo `test/test123` se crea automáticamente al primer arranque si
  no hay usuarios.

## API externa (randomuser.me)

En la pestaña **Usuarios**, el botón **"Generar con API"** consume la API REST
pública [randomuser.me](https://randomuser.me/) con `fetch` + `async/await`
(`?nat=es` para nombres españoles). La respuesta rellena el formulario y cada
usuario recibe una **foto de perfil del set LEGO** de randomuser.me, visible en
el formulario y en la lista.

Los datos externos se **sanean y validan** antes de usarse:

- El nombre de usuario se limpia de caracteres no permitidos y se recorta.
- La foto solo se acepta si proviene exactamente del set LEGO de randomuser.me
  (cualquier otra URL se descarta).
- Si la contraseña generada no cumple las reglas, se reemplaza por una segura
  generada localmente con `crypto.getRandomValues`.
- Errores de red o respuestas inesperadas muestran mensajes claros sin romper
  la app (manejo de errores, estado de carga en el botón).

## Cumplimiento de la evaluación

| Requisito de la pauta | Dónde está |
| --- | --- |
| Componentes funcionales y reutilizables | `src/components/` (SignPlayer se reutiliza; LoginForm/UsersMode independientes) |
| Hooks `useState` / `useEffect` | Todos los componentes; p. ej. `SignPlayer.jsx` (animación) y `App.jsx` (semilla de usuario demo) |
| Comunicación entre componentes | Props y callbacks (`App` → `UsersMode` con `session` y `onSessionUserChange`) |
| CRUD completo | `src/lib/users.js` (createUser, loadUsers, updateUser, deleteUser) + interfaz en `UsersMode.jsx` |
| Local Storage con validación e integridad | `src/lib/storage.js` (JSON seguro + validadores de estructura) |
| Validación de formularios y manejo de errores | `validateUserInput` en `users.js`, mensajes en LoginForm/UsersMode, errores del dictado por voz |
| Prevención de datos sensibles | Hash SHA-256 + salt; la sesión no guarda contraseñas |
| Consumo de API externa | randomuser.me en `UsersMode.jsx` (fetch, async/await, saneado de datos) |
| Uso de IA | Desarrollo asistido por IA (Claude); dictado por voz del navegador; evidencia en el documento de propuesta |

## Limitaciones conocidas

- **Dictado por voz**: funciona en **Chrome y Edge**. Brave lo bloquea (su
  navegador elimina el servicio de voz en línea) y Firefox no lo soporta; en
  esos navegadores se puede escribir el texto. Ampliación prevista: dictado
  local con Whisper (transformers.js).
- **Autenticación didáctica**: al ser una app 100% front-end, el control de
  acceso protege frente a uso casual, pero una autenticación real requiere
  backend (fuera del alcance de esta evaluación).
- **Fotos de perfil**: se cargan desde randomuser.me, por lo que necesitan
  internet para verse; sin conexión la app sigue funcionando.

## Por qué deletreo y no un avatar que firma frases

Se investigaron las opciones de "texto/voz → señas":

- **[Sign-Speak](https://sign-speak.com)** (avatar que firma): su API está
  detrás de su equipo de ventas (no es autoservicio) y solo atiende países que
  usan ASL.
- **[sign.mt](https://sign.mt)** (open-source de referencia): se movió a un
  *research preview* no público y sin español.

No hay hoy una API gratuita y estable de avatar de señas. El deletreo
dactilológico es la solución fiable, offline y educativa: sirve para cualquier
palabra o nombre y es la base real con la que se enseña a comunicarse por señas.

## Cómo ampliarlo

- **Señas de palabras completas**: diccionario `palabra → GIF/vídeo` y deletreo
  como *fallback* para lo que no esté en el diccionario.
- **Dictado local con IA**: integrar Whisper (transformers.js) para que la voz
  funcione también en Brave y Firefox (la grabación de micrófono ya está
  preparada en `lib/audioRecord.js`).
- **Avatar 3D**: si se consigue acceso a una API de producción de señas, el
  reproductor puede cambiarse por un `<video>` del avatar.

## Créditos

- Señas del abecedario: **wpclipart.com** (dominio público), vía
  [Wikimedia Commons — Categoría "ASL letters"](https://commons.wikimedia.org/wiki/Category:ASL_letters).
- Datos y fotos de perfil (set LEGO): [randomuser.me](https://randomuser.me/).
- Desarrollado con apoyo de IA (Claude) como herramienta de asistencia,
  documentado en la evidencia del proyecto.
