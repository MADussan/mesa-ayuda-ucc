# Mesa de ayuda web

Aplicación web para **registrar y consultar solicitudes de soporte técnico** de un laboratorio (fallas de equipos, internet, software u otras). Proyecto final de Computación en la nube — Universidad Cooperativa de Colombia.

- **Aplicación pública:** https://mesa-ayuda-ucc.onrender.com
- **Repositorio:** https://github.com/MADussan/mesa-ayuda-ucc
- **Imagen Docker:** [madussan/mesa-ayuda:1.0](https://hub.docker.com/r/madussan/mesa-ayuda)

> Es una demostración pública: usa **solo datos ficticios**.

## Funcionalidades

| Página | Ruta | Qué hace |
|---|---|---|
| Registro | `/` | Formulario con nombre, correo, tipo de problema, descripción y prioridad. Valida y, si todo está bien, guarda y muestra el identificador (`SOL-0001`, `SOL-0002`, …). |
| Consulta | `/consulta` | Lista todas las solicitudes: identificador, solicitante, tipo, descripción, prioridad y fecha, de la más reciente a la más antigua. |
| Salud | `/salud` | Responde `{"estado":"ok"}`; Render y Docker lo usan para saber si la app está viva. |

API usada por las páginas:

- `POST /api/solicitudes` → `201 {"id":"SOL-0001","fecha":"..."}` o `400 {"errores":{...}}` (no guarda nada).
- `GET /api/solicitudes` → `{"total":N,"solicitudes":[...]}` (sin el correo, porque la consulta es pública).

### Validaciones (en el servidor, y repetidas en el navegador)

| Campo | Regla |
|---|---|
| Nombre del solicitante | Obligatorio (los espacios solos no cuentan), máx. 100 caracteres |
| Correo electrónico | Obligatorio y con formato `nombre@dominio.ext` |
| Tipo de problema | `Equipo`, `Internet`, `Software` u `Otro` |
| Descripción | Obligatoria, **mínimo 15 caracteres**, máx. 1000 |
| Prioridad | `Baja`, `Media` o `Alta` |

La fecha y hora de creación las pone el servidor automáticamente.

## Tecnologías

- **Node.js 22 + Express 4** (servidor y API)
- **HTML, CSS y JavaScript** sin frameworks (interfaz)
- **Archivo JSON** en el servidor como almacenamiento (`data/solicitudes.json`)
- **node:test** para las pruebas automáticas (no requiere librerías extra)
- **Docker** y **Render** para el despliegue

## Estructura

```
mesa-ayuda/
├── server.js            # Punto de entrada: lee PORT y DATA_DIR, arranca Express
├── src/
│   ├── app.js           # Rutas y API
│   ├── validation.js    # Reglas del formulario (fuente de verdad)
│   └── store.js         # Lectura/escritura del archivo JSON
├── public/              # Páginas, estilos, scripts y fuente tipográfica
├── tests/               # Pruebas automáticas
├── Dockerfile
├── .dockerignore
├── render.yaml          # Configuración de despliegue en Render
└── README.md
```

## Requisitos

- Node.js 20 o superior (probado con 22) y npm
- Git
- Docker Desktop (Windows) o Docker Engine

## Ejecutar en local (sin Docker)

```cmd
git clone https://github.com/MADussan/mesa-ayuda-ucc.git
cd mesa-ayuda-ucc
npm install
npm start
```

Abrir `http://localhost:3000`. Los datos quedan en la carpeta `data\solicitudes.json`.

Pruebas automáticas:

```cmd
npm test
```

## Docker

### Construir la imagen

```cmd
docker build -t mesa-ayuda:1.0 .
```

### Crear el volumen y ejecutar el contenedor

```cmd
docker volume create mesa-datos
docker run -d --name mesa-ayuda -p 3000:3000 -v mesa-datos:/app/data mesa-ayuda:1.0
```

- **Puerto:** `-p 3000:3000` → puerto 3000 del equipo hacia el 3000 del contenedor. Abrir `http://localhost:3000`.
- **Volumen:** `-v mesa-datos:/app/data` → el volumen con nombre `mesa-datos` se monta en `/app/data`, donde la app guarda `solicitudes.json`.

### Verificar que está corriendo y ver los registros

```cmd
docker ps
docker logs mesa-ayuda
```

`docker logs` muestra cada solicitud guardada (`[guardada] SOL-0001 ...`) y cada intento rechazado (`[rechazada] campos con error: ...`).

### Prueba de persistencia (obligatoria)

1. Registrar una solicitud en `http://localhost:3000`.
2. Eliminar el contenedor (**sin** borrar el volumen):
   ```cmd
   docker rm -f mesa-ayuda
   ```
3. Crear el contenedor otra vez con el **mismo volumen**:
   ```cmd
   docker run -d --name mesa-ayuda -p 3000:3000 -v mesa-datos:/app/data mesa-ayuda:1.0
   ```
4. Abrir `http://localhost:3000/consulta`: la solicitud sigue ahí.

No ejecutar `docker volume rm mesa-datos` durante la prueba: eso sí borra los datos.

### Publicar la imagen en Docker Hub (opcional)

```cmd
docker login
docker tag mesa-ayuda:1.0 madussan/mesa-ayuda:1.0
docker push madussan/mesa-ayuda:1.0
```

## Despliegue en la nube (Render)

Render construye la imagen directamente desde el `Dockerfile` del repositorio.

1. En Render: **New → Web Service → Build and deploy from a Git repository** y elegir este repositorio.
2. **Runtime/Language:** Docker. **Branch:** `main`. **Instance type:** Free.
3. **Health Check Path:** `/salud`.
4. Variable de entorno opcional: `DATA_DIR=/app/data`. **No** definir `PORT`: Render la asigna y la app la lee automáticamente.
5. Crear el servicio. Con *Auto-Deploy* activado, cada `git push` a `main` vuelve a desplegar.

También se puede crear con **New → Blueprint** usando el archivo `render.yaml`.

### ¿Los datos en la nube son persistentes?

**No en el plan gratuito de Render: son temporales.** El sistema de archivos del contenedor es efímero:

- Mientras el servicio está activo, las solicitudes se guardan en `/app/data/solicitudes.json` y se pueden consultar normalmente.
- Al **volver a desplegar** (cada `git push` o *Manual Deploy*), al **reiniciar** el servicio, o cuando el plan gratuito lo **suspende por inactividad** (unos 15 minutos sin visitas), se crea un contenedor nuevo y **el archivo vuelve a empezar vacío**.
- Para que fueran persistentes habría que añadir un *Persistent Disk* de Render montado en `/app/data` (requiere un plan pago) o usar una base de datos externa. El proyecto no lo exige, así que se deja documentado.

**En local la persistencia sí está garantizada** con el volumen de Docker (ver la prueba de arriba).

## Pruebas de aceptación

| Prueba | Resultado esperado | Cómo se verifica |
|---|---|---|
| Datos válidos | Guarda y confirma con un identificador | `npm test` (api.test.js) y manual en el navegador |
| Campo obligatorio vacío | Informa el error y no guarda | `npm test` + manual |
| Correo inválido o descripción corta | Rechaza cada caso; no guarda | `npm test` + manual (`laura@`, `PC no prende`) |
| Tres solicitudes registradas | Las tres aparecen en la consulta | `npm test` + `/consulta` |
| Contenedor local recreado | Conserva los datos con el mismo volumen | Pasos de "Prueba de persistencia" |
| URL desde otro dispositivo | Permite registrar y consultar | Abrir la URL de Render desde un celular |

Las pruebas automáticas (26) cubren además: descripción de 14 vs. 15 caracteres, valores fuera de la lista, 10 registros simultáneos sin identificadores repetidos, archivo JSON dañado (se respalda y la app sigue), texto con HTML mostrado sin ejecutarse y cuerpo mayor a 10 KB.

## Decisiones de diseño

- **Archivo JSON con escritura atómica:** se escribe un archivo temporal y luego se renombra, para que un corte a mitad de escritura no dañe los datos.
- **Cola de escrituras:** dos registros simultáneos no pueden recibir el mismo identificador.
- **El correo no se muestra en la consulta pública**, porque la aplicación está en internet.
- **Contenedor sin root** (`USER node`) y con `HEALTHCHECK`.

## Uso de inteligencia artificial y fuentes

Se utilizó Claude (Anthropic) como apoyo para estructurar el código, las pruebas, el Dockerfile y esta documentación. El grupo revisó, ejecutó y probó todo lo entregado. Fuentes consultadas: documentación oficial de [Express](https://expressjs.com/), [Node.js](https://nodejs.org/docs/latest-v22.x/api/), [Docker](https://docs.docker.com/) y [Render](https://render.com/docs). Tipografía: Instrument Sans (SIL Open Font License).
