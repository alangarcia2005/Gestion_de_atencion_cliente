import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, interval, startWith, switchMap } from 'rxjs';

interface Mesa { id: number; numero: number; capacidad: number; disponible: boolean; }
interface Resumen { turnos_espera: number; mesas_libres: number; en_atencion: number; mesas_disponibles: Mesa[]; }
interface TurnoCreado { numero: number; cliente: string; mesa: number; estado: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <main class="page">
      <header class="hero">
        <div class="hero-copy">
          <p class="eyebrow"><span class="sparkle">✦</span> CENTRO DE ATENCIÓN</p>
          <h1>Hola, bienvenido <span class="sparkle">✳</span></h1>
          <p class="subtitle">Todo listo para atenderte. Elige una mesa y toma tu turno.</p>
        </div>
        <button class="primary top-action" type="button" (click)="focusForm()"><span aria-hidden="true">＋</span> Tomar un turno</button>
      </header>

      <p *ngIf="error()" class="notice error" role="alert">{{ error() }}</p>

      <section class="stats" aria-label="Resumen de atención">
        <article class="stat-card">
          <div class="stat-icon purple" aria-hidden="true">▤</div>
          <div class="stat-content"><p class="stat-label">EN ESPERA</p><strong>{{ resumen().turnos_espera }}</strong><span>clientes en fila</span></div>
          <span class="stat-arrow" aria-hidden="true">↗</span>
        </article>
        <article class="stat-card">
          <div class="stat-icon green" aria-hidden="true">●</div>
          <div class="stat-content"><p class="stat-label">MESAS LIBRES</p><strong>{{ resumen().mesas_libres }}</strong><span>listas para atender</span></div>
          <span class="stat-arrow flower" aria-hidden="true">✳</span>
        </article>
        <article class="stat-card">
          <div class="stat-icon orange" aria-hidden="true">◷</div>
          <div class="stat-content"><p class="stat-label">EN ATENCIÓN</p><strong>{{ resumen().en_atencion }}</strong><span>clientes siendo atendidos</span></div>
          <span class="stat-arrow" aria-hidden="true">↗</span>
        </article>
      </section>

      <section id="nuevo-turno" class="turn-card" aria-labelledby="turn-title">
        <ng-container *ngIf="!turnoCreado(); else confirmation">
          <div class="turn-copy">
            <p class="eyebrow">NUEVO TURNO</p>
            <h2 id="turn-title">¿Quién sigue?</h2>
            <p>Escribe tu nombre y selecciona una mesa disponible.</p>
          </div>
          <form class="turn-form" (ngSubmit)="confirmarTurno()">
            <label class="sr-only" for="cliente">Nombre del cliente</label>
            <input #nombreInput id="cliente" name="cliente" [ngModel]="cliente()" (ngModelChange)="cliente.set($event)" maxlength="80" placeholder="Nombre del cliente" autocomplete="name">
            <label class="sr-only" for="mesa">Mesa disponible</label>
            <select id="mesa" name="mesa" [ngModel]="mesaSeleccionadaId()" (ngModelChange)="mesaSeleccionadaId.set($event)" [disabled]="mesasDisponibles().length === 0">
              <option [ngValue]="null">{{ mesasDisponibles().length ? 'Elige una mesa' : 'Sin mesas libres' }}</option>
              <option *ngFor="let mesa of mesasDisponibles()" [ngValue]="mesa.id">Mesa {{ mesa.numero }} · {{ mesa.capacidad }} personas</option>
            </select>
            <button class="primary generate" type="submit" [disabled]="enviando() || !cliente().trim() || mesaSeleccionadaId() === null || mesasDisponibles().length === 0">
              {{ enviando() ? 'Generando…' : 'Generar turno' }} <span aria-hidden="true">→</span>
            </button>
          </form>
          <p *ngIf="mesasDisponibles().length === 0" class="availability-note">No hay mesas disponibles en este momento. Acércate al personal.</p>
        </ng-container>
        <ng-template #confirmation>
          <div class="success-icon" aria-hidden="true">✓</div>
          <div class="success-copy"><p class="eyebrow">TURNO GENERADO</p><h2>Tu turno es el #{{ turnoCreado()?.numero }}</h2><p>{{ turnoCreado()?.cliente }}, te esperamos en la mesa {{ turnoCreado()?.mesa }}.</p></div>
          <button class="primary generate" type="button" (click)="reiniciar()">Tomar otro turno <span aria-hidden="true">→</span></button>
        </ng-template>
      </section>

      <footer><span>¿Necesitas ayuda? Nuestro equipo está para atenderte.</span><span class="refresh-note"><i></i> Disponibilidad actualizada automáticamente</span></footer>
    </main>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly subscriptions = new Subscription();
  @ViewChild('nombreInput') private nombreInput?: ElementRef<HTMLInputElement>;

  readonly resumen = signal<Resumen>({ turnos_espera: 0, mesas_libres: 0, en_atencion: 0, mesas_disponibles: [] });
  readonly mesasDisponibles = signal<Mesa[]>([]);
  readonly cliente = signal('');
  readonly mesaSeleccionadaId = signal<number | null>(null);
  readonly error = signal('');
  readonly enviando = signal(false);
  readonly turnoCreado = signal<TurnoCreado | null>(null);

  ngOnInit(): void {
    this.subscriptions.add(interval(5000).pipe(startWith(0), switchMap(() => this.http.get<Resumen>('/api/resumen/'))).subscribe({
      next: (resumen) => this.aplicarResumen(resumen),
      error: () => this.error.set('No se pudo conectar con el servidor. Intenta de nuevo en un momento.')
    }));
  }

  focusForm(): void {
    this.turnoCreado.set(null);
    document.getElementById('nuevo-turno')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    this.nombreInput?.nativeElement.focus();
  }

  confirmarTurno(): void {
    const nombre = this.cliente().trim();
    const mesaId = this.mesaSeleccionadaId();
    if (!nombre || mesaId === null || this.enviando()) return;
    this.enviando.set(true);
    this.error.set('');
    this.subscriptions.add(this.http.post<TurnoCreado>('/api/turnos/', { cliente: nombre, mesa_id: mesaId }).subscribe({
      next: (turno) => {
        this.turnoCreado.set(turno);
        this.cliente.set('');
        this.mesaSeleccionadaId.set(null);
        this.enviando.set(false);
        this.actualizarResumen();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(error.status === 409 ? 'Alguien acaba de tomar esa mesa. Elige otra.' : 'No pudimos registrar tu turno. Intenta de nuevo.');
        this.mesaSeleccionadaId.set(null);
        this.enviando.set(false);
        this.actualizarResumen();
      }
    }));
  }

  reiniciar(): void {
    this.turnoCreado.set(null);
    this.cliente.set('');
    this.mesaSeleccionadaId.set(null);
    this.error.set('');
    this.focusForm();
  }

  ngOnDestroy(): void { this.subscriptions.unsubscribe(); }

  private actualizarResumen(): void {
    this.subscriptions.add(this.http.get<Resumen>('/api/resumen/').subscribe({
      next: (resumen) => this.aplicarResumen(resumen),
      error: () => this.error.set('No se pudo actualizar la disponibilidad. Intenta de nuevo.')
    }));
  }

  private aplicarResumen(resumen: Resumen): void {
    this.resumen.set(resumen);
    this.mesasDisponibles.set(resumen.mesas_disponibles);
    this.error.set('');
    const seleccionada = this.mesaSeleccionadaId();
    if (seleccionada !== null && !resumen.mesas_disponibles.some((mesa) => mesa.id === seleccionada)) this.mesaSeleccionadaId.set(null);
  }
}