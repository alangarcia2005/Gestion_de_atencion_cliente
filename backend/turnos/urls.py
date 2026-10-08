from django.urls import path
from . import views

urlpatterns = [
    path("mesas/", views.listar_mesas, name="listar-mesas"),
    path("resumen/", views.resumen, name="resumen"),
    path("turnos/", views.tomar_turno, name="tomar-turno"),
    path("mesas/<int:mesa_id>/desocupar/", views.liberar_mesa, name="desocupar-mesa"),
]
