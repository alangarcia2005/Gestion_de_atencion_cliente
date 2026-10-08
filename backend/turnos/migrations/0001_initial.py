from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(name="Mesa", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("numero", models.PositiveSmallIntegerField(unique=True)), ("capacidad", models.PositiveSmallIntegerField(default=2)), ("disponible", models.BooleanField(default=True))], options={"ordering": ["numero"]}),
        migrations.CreateModel(name="Turno", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("numero", models.PositiveIntegerField(editable=False, unique=True)), ("cliente", models.CharField(max_length=80)), ("estado", models.CharField(choices=[("esperando", "Esperando"), ("en_atencion", "En atención"), ("finalizado", "Finalizado"), ("cancelado", "Cancelado")], default="esperando", max_length=16)), ("creado_en", models.DateTimeField(auto_now_add=True)), ("mesa", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="turnos", to="turnos.mesa"))], options={"ordering": ["-creado_en"]}),
    ]
