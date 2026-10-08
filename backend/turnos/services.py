from django.db import transaction

from .models import Mesa, Turno


@transaction.atomic
def asignar_turnos_pendientes():
    """Asigna cada turno en espera sin mesa a la mesa libre con menor número."""
    asignaciones = []
    while True:
        mesa = Mesa.objects.select_for_update().filter(disponible=True).order_by("numero").first()
        turno = Turno.objects.select_for_update().filter(
            mesa__isnull=True,
            estado=Turno.Estado.ESPERANDO,
        ).order_by("creado_en", "numero").first()
        if mesa is None or turno is None:
            break

        turno.mesa = mesa
        turno.save(update_fields=["mesa"])
        mesa.disponible = False
        mesa.save(update_fields=["disponible"])
        asignaciones.append((turno, mesa))

    return asignaciones
