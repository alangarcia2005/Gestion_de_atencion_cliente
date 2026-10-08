from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("turnos", "0001_initial")]

    operations = [
        migrations.AlterField(
            model_name="turno",
            name="mesa",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="turnos",
                to="turnos.mesa",
            ),
        ),
        migrations.AlterField(
            model_name="turno",
            name="numero",
            field=models.PositiveIntegerField(blank=True, editable=False, null=True, unique=True),
        ),
    ]
