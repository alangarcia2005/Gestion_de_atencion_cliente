from django.db import models

class Mesa(models.Model):
    numero = models.PositiveSmallIntegerField(unique=True)
    capacidad = models.PositiveSmallIntegerField(default=2)
    disponible = models.BooleanField(default=True)

    class Meta:
        ordering = ["numero"]

    def __str__(self):
        return f"Mesa {self.numero}"

class Turno(models.Model):
    class Estado(models.TextChoices):
        ESPERANDO = "esperando", "Esperando"
        EN_ATENCION = "en_atencion", "En atención"
        FINALIZADO = "finalizado", "Finalizado"
        CANCELADO = "cancelado", "Cancelado"

    numero = models.PositiveIntegerField(unique=True, editable=False, null=True, blank=True)
    cliente = models.CharField(max_length=80)
    mesa = models.ForeignKey(Mesa, on_delete=models.PROTECT, related_name="turnos", null=True, blank=True)
    estado = models.CharField(max_length=16, choices=Estado.choices, default=Estado.ESPERANDO)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-creado_en"]

    def save(self, *args, **kwargs):
        nuevo_sin_numero = self._state.adding and self.numero is None
        super().save(*args, **kwargs)
        if nuevo_sin_numero:
            self.numero = self.pk
            type(self).objects.filter(pk=self.pk).update(numero=self.numero)

    def __str__(self):
        return f"Turno {self.numero} — {self.cliente}"
