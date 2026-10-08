import { HttpClient, HttpClientModule, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval, startWith, switchMap } from 'rxjs';

interface Mesa { id: number; numero: number; capacidad: number; disponible: boolean; turno_numero: number | null; turno_estado: string | null; }
interface Resumen { turnos_espera: number; mesas_libres: number; en_atencion: number; mesas: Mesa[]; personal: boolean; }
interface TurnoCreado { numero: number; mesa: number | null; estado: string; }
interface ResultadoLiberacion { detail: string; mesa: number; turno_asignado: number | null; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly subscriptions = new Subscription();

  readonly resumen = signal<Resumen>({ turnos_espera: 0, mesas_libres: 0, en_atencion: 0, mesas: [], personal: false });
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly enviando = signal(false);
  readonly desocupandoId = signal<number | null>(null);
  readonly turnoCreado = signal<TurnoCreado | null>(null);

  ngOnInit(): void {
    this.subscriptions.add(interval(5000).pipe(startWith(0), switchMap(() => this.http.get<Resumen>('/api/resumen/'))).subscribe({
      next: (resumen) => this.resumen.set(resumen),
      error: () => this.error.set('No se pudo conectar con el servidor. Intenta de nuevo en un momento.')
    }));
  }

  tomarTurno(): void {
    if (this.enviando()) return;
    this.error.set('');
    this.mensaje.set('');
    this.turnoCreado.set(null);
    this.enviando.set(true);
    this.subscriptions.add(this.http.post<TurnoCreado>('/api/turnos/', {}).subscribe({
      next: (turno) => {
        this.turnoCreado.set(turno);
        this.enviando.set(false);
        this.actualizarResumen();
      },
      error: () => {
        this.error.set('No pudimos registrar tu turno. Intenta de nuevo.');
        this.enviando.set(false);
      }
    }));
  }

  cerrarConfirmacion(): void { this.turnoCreado.set(null); }

  desocupar(mesa: Mesa): void {
    this.error.set('');
    this.mensaje.set('');
    this.desocupandoId.set(mesa.id);
    const csrf = this.tokenCsrf();
    const options = csrf ? { headers: new HttpHeaders({ 'X-CSRFToken': csrf }) } : {};
    this.http.post<ResultadoLiberacion>('/api/mesas/' + mesa.id + '/desocupar/', {}, options).subscribe({
      next: (resultado) => {
        this.desocupandoId.set(null);
        this.mensaje.set(resultado.turno_asignado !== null
          ? 'Mesa ' + resultado.mesa + ' desocupada; el turno #' + resultado.turno_asignado + ' fue asignado automáticamente.'
          : 'Mesa ' + resultado.mesa + ' desocupada. Quedó disponible.');
        this.actualizarResumen();
      },
      error: (error: HttpErrorResponse) => {
        this.desocupandoId.set(null);
        this.error.set(error.status === 401 || error.status === 403
          ? 'Inicia sesión como personal en Administración para desocupar mesas.'
          : 'No se pudo desocupar la mesa. Intenta de nuevo.');
      }
    });
  }

  ngOnDestroy(): void { this.subscriptions.unsubscribe(); }

  private actualizarResumen(): void {
    this.subscriptions.add(this.http.get<Resumen>('/api/resumen/').subscribe({
      next: (resumen) => this.resumen.set(resumen),
      error: () => this.error.set('No se pudo actualizar el estado de las mesas.')
    }));
  }

  private tokenCsrf(): string {
    const csrf = document.cookie.split('; ').find((cookie) => cookie.startsWith('csrftoken='));
    return csrf ? decodeURIComponent(csrf.substring('csrftoken='.length)) : '';
  }
}
