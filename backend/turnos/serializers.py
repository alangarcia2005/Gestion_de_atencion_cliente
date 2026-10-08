from rest_framework import serializers
from .models import Mesa, Turno

class MesaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mesa
        fields = ["id", "numero", "capacidad", "disponible"]

class CrearTurnoSerializer(serializers.Serializer):
    cliente = serializers.CharField(max_length=80, trim_whitespace=True, required=False, default="Cliente")

    def validate_cliente(self, value):
        if not value:
            return "Cliente"
        return value
