import { normalizeAgendaEventWritePayload } from './firebase-event.repository';
import { AgendaEventPayload } from '../../core/models/event.model';

describe('normalizeAgendaEventWritePayload', () => {
  const basePayload: AgendaEventPayload = {
    title: 'Evento',
    start: '2026-05-26T10:00',
    allDay: false,
    description: 'Descrição',
    location: 'Local',
    color: '#c9a84c',
    isPrivate: false,
  };

  it('sets end to null when undefined', () => {
    expect(normalizeAgendaEventWritePayload(basePayload)).toEqual({
      ...basePayload,
      end: null,
    });
  });

  it('sets end to null when empty', () => {
    expect(normalizeAgendaEventWritePayload({ ...basePayload, end: '   ' })).toEqual({
      ...basePayload,
      end: null,
    });
  });

  it('preserves end when provided', () => {
    expect(normalizeAgendaEventWritePayload({ ...basePayload, end: '2026-05-26T11:00' })).toEqual({
      ...basePayload,
      end: '2026-05-26T11:00',
    });
  });
});
