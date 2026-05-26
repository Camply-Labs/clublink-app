// ============================================================
//  ICS Service — Parse e geração de arquivos iCalendar (.ics)
//  Implementação sem dependências externas (RFC 5545)
// ============================================================

import { Injectable } from '@angular/core';
import { AgendaEvent } from '../models/event.model';

export interface IcsParseResult {
  events:    Partial<AgendaEvent>[];
  hash:      string;
  filename:  string;
}

@Injectable({ providedIn: 'root' })
export class IcsService {

  // ── Parse de arquivo .ics ─────────────────────────────────

  async parseFile(file: File): Promise<IcsParseResult> {
    const text  = await file.text();
    const hash  = await this.sha256(text);
    const events = this.parseIcs(text);
    return { events, hash, filename: file.name };
  }

  private parseIcs(text: string): Partial<AgendaEvent>[] {
    // Normaliza line folding (RFC 5545: linhas longas são continuadas com CRLF + espaço)
    const unfolded = text.replace(/\r\n[ \t]/g, '').replace(/\r\n/g, '\n');
    const events: Partial<AgendaEvent>[] = [];

    const blocks = unfolded.split('BEGIN:VEVENT');
    blocks.shift(); // remove o cabeçalho do calendário

    for (const block of blocks) {
      const lines = block.split('\n');
      const ev: Partial<AgendaEvent> = {
        source:    'import',
        allDay:    false,
        isPrivate: false,
        color:     '#4299e1',
      };

      for (const rawLine of lines) {
        if (rawLine.startsWith('END:VEVENT')) break;

        const colonIdx = rawLine.indexOf(':');
        if (colonIdx === -1) continue;

        const key   = rawLine.slice(0, colonIdx).toUpperCase();
        const value = rawLine.slice(colonIdx + 1).trim();

        // Extrai parâmetros do key (ex: DTSTART;TZID=America/Sao_Paulo)
        const [baseKey, ...params] = key.split(';');
        const paramStr = params.join(';');

        switch (baseKey) {
          case 'SUMMARY':
            ev.title = this.unescapeIcs(value);
            break;

          case 'DESCRIPTION':
            ev.description = this.unescapeIcs(value);
            break;

          case 'LOCATION':
            ev.location = this.unescapeIcs(value);
            break;

          case 'DTSTART':
            if (paramStr.includes('VALUE=DATE') || /^\d{8}$/.test(value)) {
              ev.start  = this.dateOnlyToIso(value);
              ev.allDay = true;
            } else {
              ev.start = this.icsDateTimeToIso(value);
            }
            break;

          case 'DTEND':
            if (paramStr.includes('VALUE=DATE') || /^\d{8}$/.test(value)) {
              ev.end = this.dateOnlyToIso(value);
            } else {
              ev.end = this.icsDateTimeToIso(value);
            }
            break;

          case 'DURATION':
            // Ignora DURATION — usaremos apenas DTEND se disponível
            break;

          case 'CLASS':
            // PRIVATE ou CONFIDENTIAL = privado
            ev.isPrivate = value === 'PRIVATE' || value === 'CONFIDENTIAL';
            break;

          case 'COLOR':
            // Extensão do Google Calendar
            ev.color = value.startsWith('#') ? value : `#${value}`;
            break;

          case 'STATUS':
            break;

          case 'UID':
            // Guardamos o UID original como parte do título se precisar de debug
            break;
        }
      }

      if (ev.title && ev.start) {
        events.push(ev);
      }
    }

    return events;
  }

  // ── Geração de arquivo .ics ───────────────────────────────

  generate(events: AgendaEvent[], calendarName = 'Garras de Águia'): string {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Garras de Águia//Agenda//PT',
      `X-WR-CALNAME:${calendarName}`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    for (const ev of events) {
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${ev.id}@garras-de-aguia`);
      lines.push(`SUMMARY:${this.escapeIcs(ev.title)}`);

      if (ev.allDay) {
        lines.push(`DTSTART;VALUE=DATE:${this.isoToDateOnly(ev.start)}`);
        if (ev.end) lines.push(`DTEND;VALUE=DATE:${this.isoToDateOnly(ev.end)}`);
      } else {
        lines.push(`DTSTART:${this.isoToIcsDateTime(ev.start)}`);
        if (ev.end) lines.push(`DTEND:${this.isoToIcsDateTime(ev.end)}`);
      }

      if (ev.description) lines.push(`DESCRIPTION:${this.escapeIcs(ev.description)}`);
      if (ev.location)    lines.push(`LOCATION:${this.escapeIcs(ev.location)}`);
      lines.push(`CLASS:${ev.isPrivate ? 'PRIVATE' : 'PUBLIC'}`);
      lines.push(`STATUS:CONFIRMED`);
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  downloadIcs(content: string, filename = 'garras-de-aguia.ics'): void {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Hash SHA-256 ──────────────────────────────────────────

  async sha256(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data    = encoder.encode(text);
    const buffer  = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // ── Conversores de data ───────────────────────────────────

  /** YYYYMMDD → YYYY-MM-DD */
  private dateOnlyToIso(s: string): string {
    if (s.length === 8) return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
    return s;
  }

  /** YYYYMMDDTHHMMSSZ ou YYYYMMDDTHHMMSS → ISO string */
  private icsDateTimeToIso(s: string): string {
    const match = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
    if (!match) {
      throw new Error(`Invalid ICS date-time format: ${s}`);
    }

    const [, year, month, day, hour, minute, second, z] = match;
    const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}${z ? 'Z' : ''}`;
    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid ICS date-time value: ${s}`);
    }

    return date.toISOString();
  }

  /** ISO string → YYYYMMDD */
  private isoToDateOnly(iso: string): string {
    return iso.slice(0, 10).replace(/-/g, '');
  }

  /** ISO string → YYYYMMDDTHHMMSSZ */
  private isoToIcsDateTime(iso: string): string {
    return new Date(iso).toISOString().replace(/[-:]/g, '').replace('.000', '');
  }

  /** Escape de caracteres especiais para iCalendar */
  private escapeIcs(s: string): string {
    return s.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
  }

  private unescapeIcs(s: string): string {
    return s.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
  }
}
