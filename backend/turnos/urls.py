from django.urls import path
from . import views

urlpatterns = [
    path("mesas/", views.listar_mesas, name="listar-mesas"),
    path("turnos/", views.tomar_turno, name="tomar-turno"),
    path("mesas/<int:mesa_id>/liberar/", views.liberar_mesa, name="liberar-mesa"),
]
