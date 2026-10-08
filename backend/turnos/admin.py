from django.contrib import admin, messages
from django.db import transaction
from .models import Mesa, Turno

@admin.action(description="Finalizar turnos y liberar mesas seleccionadas")
def liberar_mesas(modeladmin, request, queryset):
    liberadas = 0
    for mesa_id in queryset.values_list("id", flat=True):
        with transaction.atomic():
            mesa = Mesa.objects.select_for_update().get(pk=mesa_id)
            turnos_activos = mesa.turnos.filter(estado__in=[Turno.Estado.ESPERANDO, Turno.Estado.EN_ATENCION])
            turnos_activos.update(estado=Turno.Estado.FINALIZADO)
            if not mesa.disponible:
                mesa.disponible = True
                mesa.save(update_fields=["disponible"])
                liberadas += 1
    messages.success(request, f"Se liberaron {liberadas} mesa(s).")

@admin.register(Mesa)
class MesaAdmin(admin.ModelAdmin):
    list_display = ("numero", "capacidad", "disponible")
    list_editable = ("capacidad",)
    ordering = ("numero",)
    actions = [liberar_mesas]

@admin.register(Turno)
class TurnoAdmin(admin.ModelAdmin):
    list_display = ("numero", "cliente", "mesa", "estado", "creado_en")
    list_filter = ("estado", "creado_en")
    search_fields = ("cliente",)
    readonly_fields = ("numero", "creado_en")
