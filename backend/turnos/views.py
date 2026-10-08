from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from .models import Mesa, Turno
from .serializers import CrearTurnoSerializer, MesaSerializer
from .services import asignar_turnos_pendientes

@api_view(["GET"])
@permission_classes([AllowAny])
def listar_mesas(request):
    return Response(MesaSerializer(Mesa.objects.all(), many=True).data)

@api_view(["GET"])
@permission_classes([AllowAny])
def resumen(request):
    mesas = []
    for mesa in Mesa.objects.all():
        turno_activo = mesa.turnos.filter(
            estado__in=[Turno.Estado.ESPERANDO, Turno.Estado.EN_ATENCION]
        ).order_by("creado_en", "numero").first()
        mesas.append({
            "id": mesa.id,
            "numero": mesa.numero,
            "capacidad": mesa.capacidad,
            "disponible": mesa.disponible,
            "turno_numero": turno_activo.numero if turno_activo else None,
            "turno_estado": turno_activo.estado if turno_activo else None,
        })
    return Response({
        "turnos_espera": Turno.objects.filter(
            estado=Turno.Estado.ESPERANDO, mesa__isnull=True
        ).count(),
        "mesas_libres": Mesa.objects.filter(disponible=True).count(),
        "en_atencion": Turno.objects.filter(estado=Turno.Estado.EN_ATENCION).count(),
        "mesas": mesas,
        "personal": bool(request.user.is_authenticated and request.user.is_staff),
    })

@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def tomar_turno(request):
    serializer = CrearTurnoSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    with transaction.atomic():
        turno = Turno.objects.create(cliente=serializer.validated_data["cliente"])
        asignar_turnos_pendientes()
        turno.refresh_from_db()
    return Response({
        "id": turno.id,
        "numero": turno.numero,
        "cliente": turno.cliente,
        "mesa": turno.mesa.numero if turno.mesa else None,
        "estado": turno.estado,
        "creado_en": turno.creado_en,
    }, status=status.HTTP_201_CREATED)

@api_view(["POST"])
@permission_classes([IsAdminUser])
def liberar_mesa(request, mesa_id):
    with transaction.atomic():
        mesa = get_object_or_404(Mesa.objects.select_for_update(), pk=mesa_id)
        turno = mesa.turnos.filter(estado__in=[Turno.Estado.ESPERANDO, Turno.Estado.EN_ATENCION]).first()
        if turno:
            turno.estado = Turno.Estado.FINALIZADO
            turno.save(update_fields=["estado"])
        mesa.disponible = True
        mesa.save(update_fields=["disponible"])
        asignaciones = asignar_turnos_pendientes()
        siguiente = next((turno for turno, asignada in asignaciones if asignada.pk == mesa.pk), None)
    return Response({
        "detail": f"Mesa {mesa.numero} desocupada.",
        "mesa": mesa.numero,
        "turno_asignado": siguiente.numero if siguiente else None,
    })
