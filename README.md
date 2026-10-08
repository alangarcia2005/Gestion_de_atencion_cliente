# Turnos del restaurante

Sistema de autoservicio: desde una pantalla dentro del restaurante, el cliente selecciona una mesa disponible, registra su nombre y recibe un turno. Al tomar turno, la mesa se reserva hasta que el personal la libera.

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

En el panel `http://127.0.0.1:8000/admin/`, inicia sesión y crea las mesas. Para terminar un turno y devolver una mesa a disponibilidad, selecciona la mesa en la lista y usa la acción **Finalizar turnos y liberar mesas seleccionadas**.

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
- `POST /api/turnos/`: crea turno. JSON: `{"cliente":"Ana","mesa_id":1}`. Si la mesa acaba de ser tomada, responde `409`.
- `POST /api/mesas/<id>/liberar/`: finaliza el turno activo y libera la mesa. Requiere un usuario administrador autenticado.

## GitHub
El monorepo incluye frontend y backend para compartir issues, documentación y cambios. Para publicarlo, crea un repositorio vacío en GitHub y, desde esta carpeta, configura el remoto y envía la rama principal.
