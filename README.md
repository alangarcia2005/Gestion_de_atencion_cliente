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
