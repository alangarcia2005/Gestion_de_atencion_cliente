# Turnos del restaurante

Sistema de autoservicio: desde una pantalla dentro del restaurante, el cliente registra su nombre y recibe un número de turno. El sistema asigna automáticamente la primera mesa libre; si todas están ocupadas, conserva al cliente en fila y le asigna la siguiente mesa que el personal desocupe.

## Tecnologías
- Backend: Python 3.12, Django y Django REST Framework.
- Frontend: Angular 21, interfaz tipo kiosco.
- Base de datos inicial: SQLite.
- Estructura: monorepo para versionar frontend y backend juntos en GitHub.

## Requisitos
Python 3.12 o compatible con Django 5.2. Node.js 20.19+, 22.12+ o 24+ para Angular 21.

## Iniciar el backend
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

En el panel `http://127.0.0.1:8000/admin/`, inicia sesión y crea las mesas. En el kiosco, el personal autenticado puede usar **Desocupar mesa**; el sistema finaliza el turno y asigna la mesa al cliente más antiguo que esté en fila.

## Iniciar Angular
En otra terminal:
```powershell
cd frontend
npm install
npm start
```

Abre `http://localhost:4200`. El servidor de desarrollo reenvía `/api` a Django.

## API
- `GET /api/mesas/`: consulta mesas y disponibilidad.
- `GET /api/resumen/`: devuelve los contadores del kiosco, mesas, turnos activos y estado de la sesión del personal.
- `POST /api/turnos/`: crea un turno y lo asigna a la mesa libre siguiente. JSON: `{"cliente":"Ana"}`. Si no hay mesas libres, el turno queda en fila.
- `POST /api/mesas/<id>/desocupar/`: finaliza el turno activo y asigna esa mesa al turno más antiguo en fila. Requiere una sesión de personal autenticada.

## GitHub
El monorepo incluye frontend y backend para compartir issues, documentación y cambios. Para publicarlo, crea un repositorio vacío en GitHub y, desde esta carpeta, configura el remoto y envía la rama principal.

## Desplegar el backend Django en Vercel

El backend puede desplegarse como un segundo proyecto Vercel conectado al mismo repositorio. Al importar el repo, configura `backend` como **Root Directory** y selecciona el preset **Django/Python**. Vercel detecta `manage.py` y `config/wsgi.py`.

Antes del primer despliegue, conecta una base PostgreSQL persistente (por ejemplo, Neon desde Vercel Marketplace) al proyecto y configura estas variables en **Settings → Environment Variables**:

- `DATABASE_URL`: URL de conexión PostgreSQL proporcionada por Neon.
- `DJANGO_SECRET_KEY`: secreto aleatorio largo; no lo guardes en GitHub.
- `DJANGO_DEBUG`: `false`.
- `DJANGO_ALLOWED_HOSTS`: `.vercel.app` (agrega el dominio del API si usas uno propio).
- `CSRF_TRUSTED_ORIGINS`: origen HTTPS exacto del proyecto Angular.
- `CORS_ALLOWED_ORIGINS`: origen HTTPS exacto del proyecto Angular.

`backend/config/settings.py` conserva SQLite para ejecución local, pero exige `DATABASE_URL` en Vercel porque el almacenamiento local de funciones no es persistente. Después de desplegar, las rutas de la API están bajo `/api/`, por ejemplo `/api/resumen/`. El frontend también deberá apuntar al dominio público del API; los proxies de `ng serve` solo funcionan durante desarrollo local.
