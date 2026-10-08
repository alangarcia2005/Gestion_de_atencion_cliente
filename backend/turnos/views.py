from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from .models import Mesa, Turno
from .serializers import CrearTurnoSerializer, MesaSerializer

@api_view(["GET"])
@permission_classes([AllowAny])
def listar_mesas(request):
    return Response(MesaSerializer(Mesa.objects.all(), many=True).data)

@api_view(["POST"])
@permission_classes([AllowAny])
def tomar_turno(request):
    serializer = CrearTurnoSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    with transaction.atomic():
        mesa = get_object_or_404(Mesa.objects.select_for_update(), pk=serializer.validated_data["mesa_id"])
        if not mesa.disponible:
            return Response({"detail": "Esta mesa ya no está disponible. Elige otra."}, status=status.HTTP_409_CONFLICT)
        mesa.disponible = False
        mesa.save(update_fields=["disponible"])
        turno = Turno.objects.create(cliente=serializer.validated_data["cliente"], mesa=mesa)
    return Response({"id": turno.id, "numero": turno.numero, "cliente": turno.cliente,
                     "mesa": mesa.numero, "estado": turno.estado, "creado_en": turno.creado_en}, status=status.HTTP_201_CREATED)

@api_view(["POST"])
@permission_classes([IsAdminUser])
def liberar_mesa(request, mesa_id):
    with transaction.atomic():
        mesa = get_object_or_404(Mesa.objects.select_for_update(), pk=mesa_id)
        turno = mesa.turnos.filter(estado__in=[Turno.Estado.ESPERANDO, Turno.Estado.EN_ATENCION]).first()
        if not turno:
            return Response({"detail": "La mesa ya está disponible."}, status=status.HTTP_409_CONFLICT)
        turno.estado = Turno.Estado.FINALIZADO
        turno.save(update_fields=["estado"])
        mesa.disponible = True
        mesa.save(update_fields=["disponible"])
    return Response({"detail": f"Mesa {mesa.numero} liberada."})
