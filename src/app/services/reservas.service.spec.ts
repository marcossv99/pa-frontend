import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReservasService, ReservaRequest, ReservaResponse } from './reservas.service';

describe('ReservasService', () => {
  let service: ReservasService;
  let httpMock: HttpTestingController;

  const mockReservaRequest: ReservaRequest = {
    usuarioId: 1,
    quadraId: 1,
    data: '2024-01-15',
    horaInicio: 10,
    horaFim: 11,
    membros: ['João Silva']
  };

  const mockReservaResponse: ReservaResponse = {
    id: 1,
    usuarioId: 1,
    usuarioNome: 'João Silva',
    quadraId: 1,
    quadraNome: 'Quadra de Tênis 1',
    horarioId: 1,
    data: '2024-01-15',
    horaInicio: 10,
    horaFim: 11,
    membros: ['João Silva']
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReservasService]
    });
    service = TestBed.inject(ReservasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create reserva', () => {
    service.criar(mockReservaRequest).subscribe((response: any) => {
      expect(response).toEqual(mockReservaResponse);
    });

    const req = httpMock.expectOne('/api/reservas');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockReservaRequest);
    req.flush(mockReservaResponse);
  });

  it('should list all reservas', () => {
    const mockReservas = [mockReservaResponse];

    service.listar().subscribe((response: any) => {
      expect(response).toEqual(mockReservas);
      expect(response.length).toBe(1);
    });

    const req = httpMock.expectOne('/api/reservas');
    expect(req.request.method).toBe('GET');
    req.flush(mockReservas);
  });

  it('should get reserva by id', () => {
    service.buscarPorId(1).subscribe((response: any) => {
      expect(response).toEqual(mockReservaResponse);
    });

    const req = httpMock.expectOne('/api/reservas/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockReservaResponse);
  });

  it('should list reservas by usuario', () => {
    const mockReservas = [mockReservaResponse];

    service.listarPorUsuario(1).subscribe((response: any) => {
      expect(response).toEqual(mockReservas);
      expect(response[0].usuarioId).toBe(1);
    });

    const req = httpMock.expectOne('/api/reservas/usuario/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockReservas);
  });

  it('should delete reserva', () => {
    service.deletar(1).subscribe((response: any) => {
      expect(response).toBeUndefined();
    });

    const req = httpMock.expectOne('/api/reservas/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should get reservas by date', () => {
    const mockReservas = [mockReservaResponse];

    service.obterReservasPorData(1, '2024-01-15').subscribe((response: any) => {
      expect(response.length).toBe(1);
      expect(response[0].data).toBe('2024-01-15');
    });

    const req = httpMock.expectOne('/api/reservas/usuario/1');
    req.flush(mockReservas);
  });

  it('should check availability', () => {
    service.verificarDisponibilidadeHorario(1, '2024-01-15', 10, 11).subscribe((response: any) => {
      expect(response).toBe(true);
    });

    const req = httpMock.expectOne('/api/reservas');
    req.flush([]);
  });

  it('should detect time conflicts', () => {
    const conflictingReserva = { ...mockReservaResponse, horaInicio: 10, horaFim: 12 };
    
    service.verificarDisponibilidadeHorario(1, '2024-01-15', 10, 11).subscribe((response: any) => {
      expect(response).toBe(false);
    });

    const req = httpMock.expectOne('/api/reservas');
    req.flush([conflictingReserva]);
  });

  it('should handle error when creating reserva with conflicting time', () => {
    service.criar(mockReservaRequest).subscribe({
      next: () => fail('should have failed'),
      error: (error: any) => {
        expect(error.status).toBe(409);
      }
    });

    const req = httpMock.expectOne('/api/reservas');
    req.flush('Conflito de horário', { status: 409, statusText: 'Conflict' });
  });

  it('should handle error when reserva not found', () => {
    service.buscarPorId(999).subscribe({
      next: () => fail('should have failed'),
      error: (error: any) => {
        expect(error.status).toBe(404);
      }
    });

    const req = httpMock.expectOne('/api/reservas/999');
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });
  });

  it('should validate reserva data before creating', () => {
    const invalidReserva = { ...mockReservaRequest, usuarioId: null as any };

    service.criar(invalidReserva).subscribe({
      next: () => fail('should have failed'),
      error: (error: any) => {
        expect(error.status).toBe(400);
      }
    });

    const req = httpMock.expectOne('/api/reservas');
    req.flush('Validation error', { status: 400, statusText: 'Bad Request' });
  });

  it('should handle unauthorized access', () => {
    service.listar().subscribe({
      next: () => fail('should have failed'),
      error: (error: any) => {
        expect(error.status).toBe(401);
      }
    });

    const req = httpMock.expectOne('/api/reservas');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });
});
