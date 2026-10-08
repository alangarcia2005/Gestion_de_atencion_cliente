import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, interval, startWith, switchMap } from 'rxjs';

interface Mesa { id: number; numero: number; capacidad: number; disponible: boolean; }
interface TurnoCreado { numero: number; cliente: string; mesa: number; estado: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <main class="kiosk">
      <header class="topbar"><div class="brand-mark">M</div><div><p class="eyebrow">BIENVENIDO</p><h1>Atención a clientes</h1></div><span class="live"><i></i> EN VIVO</span></header>
      <section class="intro"><p class="eyebrow">AUTOSERVICIO</p><h2>Elige tu mesa</h2><p class="muted">Selecciona una mesa disponible para tomar tu turno.</p></section>
      <p *ngIf="error" class="notice error" role="alert">{{ error }}</p>
      <section class="tables" aria-label="Mesas disponibles">
        <button *ngFor="let mesa of mesas" class="table-card" [class.selected]="mesaSeleccionada?.id === mesa.id" [class.busy]="!mesa.disponible" [disabled]="!mesa.disponible || enviando" (click)="mesaSeleccionada = mesa">
          <span class="table-icon">{{ mesa.disponible ? '?' : '×' }}</span><strong>Mesa {{ mesa.numero }}</strong><span>{{ mesa.capacidad }} personas</span><small>{{ mesa.disponible ? 'DISPONIBLE' : 'OCUPADA' }}</small>
        </button>
        <div *ngIf="!cargando && mesas.length === 0" class="empty">No hay mesas configuradas. Pide ayuda al personal.</div>
      </section>
      <section class="checkout" *ngIf="mesaSeleccionada && !turnoCreado">
        <div><span class="muted">Mesa seleccionada</span><strong>Mesa {{ mesaSeleccionada.numero }}</strong></div>
        <label for="cliente">¿A nombre de quién registramos el turno?</label>
        <input id="cliente" name="cliente" [(ngModel)]="cliente" maxlength="80" placeholder="Tu nombre" autocomplete="name" (keyup.enter)="confirmarTurno()">
        <button class="primary" [disabled]="!cliente.trim() || enviando" (click)="confirmarTurno()">{{ enviando ? 'Registrando…' : 'Tomar turno' }} <span>?</span></button>
      </section>
      <section *ngIf="turnoCreado" class="success" role="status">
        <div class="check">?</div><p class="eyebrow">TURNO REGISTRADO</p><h2>Tu turno es el <b>#{{ turnoCreado.numero }}</b></h2><p>{{ turnoCreado.cliente }}, te atenderemos en la mesa {{ turnoCreado.mesa }}.</p><button class="primary" (click)="reiniciar()">Listo</button>
      </section>
      <footer><span>¿Necesitas ayuda? Acércate a nuestro equipo.</span><span>Disponibilidad actualizada automáticamente</span></footer>
    </main>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly subscriptions = new Subscription();
  mesas: Mesa[] = [];
  mesaSeleccionada: Mesa | null = null;
  cliente = '';
  error = '';
  cargando = true;
  enviando = false;
  turnoCreado: TurnoCreado | null = null;

  ngOnInit(): void {
    this.subscriptions.add(interval(5000).pipe(startWith(0), switchMap(() => this.http.get<Mesa[]>('/api/mesas/'))).subscribe({
      next: (mesas) => { this.mesas = mesas; this.cargando = false; if (this.mesaSeleccionada && !mesas.find((mesa) => mesa.id === this.mesaSeleccionada?.id)?.disponible) this.mesaSeleccionada = null; },
      error: () => { this.error = 'No se pudo conectar con el sistema. Intenta de nuevo en un momento.'; this.cargando = false; }
    }));
  }

  confirmarTurno(): void {
    if (!this.mesaSeleccionada || !this.cliente.trim() || this.enviando) return;
    this.enviando = true;
    this.error = '';
    this.http.post<TurnoCreado>('/api/turnos/', { cliente: this.cliente.trim(), mesa_id: this.mesaSeleccionada.id }).subscribe({
      next: (turno) => { this.turnoCreado = turno; this.enviando = false; },
      error: (error: HttpErrorResponse) => { this.error = error.status === 409 ? 'Alguien acaba de tomar esa mesa. Elige otra.' : 'No pudimos registrar tu turno. Intenta de nuevo.'; this.enviando = false; this.mesaSeleccionada = null; }
    });
  }

  reiniciar(): void { this.turnoCreado = null; this.cliente = ''; this.mesaSeleccionada = null; this.error = ''; }
  ngOnDestroy(): void { this.subscriptions.unsubscribe(); }
}
