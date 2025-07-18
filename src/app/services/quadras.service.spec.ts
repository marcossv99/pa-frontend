import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { QuadrasService, QuadraRequest, QuadraResponse } from './quadras.service';

describe('QuadrasService', () => {
  let service: QuadrasService;
  let httpMock: HttpTestingController;

  const mockQuadraRequest: QuadraRequest = {
    numero: 1,
    modalidade: 'Tênis',
    qtdPessoas: 4
  };

  const mockQuadraResponse: QuadraResponse = {
    id: 1,
    numero: 1,
    modalidade: 'Tênis',
    qtdPessoas: 4,
    isDisponivel: true,
    img: 'quadra1.jpg'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [QuadrasService]
    });
    service = TestBed.inject(QuadrasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list all quadras', () => {
    const mockQuadras = [mockQuadraResponse];

    service.listar().subscribe((response: any) => {
      expect(response).toEqual(mockQuadras);
      expect(response.length).toBe(1);
    });

    const req = httpMock.expectOne('/api/quadras');
    expect(req.request.method).toBe('GET');
    req.flush(mockQuadras);
  });

  it('should get quadra by id', () => {
    service.buscarPorId(1).subscribe((response: any) => {
      expect(response).toEqual(mockQuadraResponse);
    });

    const req = httpMock.expectOne('/api/quadras/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockQuadraResponse);
  });

  it('should create quadra', () => {
    const formData = service.criarFormDataParaCadastro(mockQuadraRequest);
    
    service.cadastrar(formData).subscribe((response: any) => {
      expect(response).toEqual(mockQuadraResponse);
    });

    const req = httpMock.expectOne('/api/quadras');
    expect(req.request.method).toBe('POST');
    req.flush(mockQuadraResponse);
  });

  it('should update quadra', () => {
    const formData = service.criarFormDataParaCadastro(mockQuadraRequest);
    
    service.editar(1, formData).subscribe((response: any) => {
      expect(response).toEqual(mockQuadraResponse);
    });

    const req = httpMock.expectOne('/api/quadras/1');
    expect(req.request.method).toBe('PUT');
    req.flush(mockQuadraResponse);
  });

  it('should delete quadra', () => {
    service.deletar(1).subscribe((response: any) => {
      expect(response).toBeUndefined();
    });

    const req = httpMock.expectOne('/api/quadras/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should change quadra availability', () => {
    service.alterarDisponibilidade(1, false).subscribe((response: any) => {
      expect(response).toEqual({ ...mockQuadraResponse, isDisponivel: false });
    });

    const req = httpMock.expectOne('/api/quadras/1/disponibilidade');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ disponivel: false });
    req.flush({ ...mockQuadraResponse, isDisponivel: false });
  });

  it('should get available quadras', () => {
    const quadras = [
      { ...mockQuadraResponse, isDisponivel: true },
      { ...mockQuadraResponse, id: 2, isDisponivel: false }
    ];

    service.obterQuadrasDisponiveis().subscribe((response: any) => {
      expect(response.length).toBe(1);
      expect(response[0].isDisponivel).toBe(true);
    });

    const req = httpMock.expectOne('/api/quadras');
    req.flush(quadras);
  });

  it('should get modalidades', () => {
    const quadras = [
      { ...mockQuadraResponse, modalidade: 'Tênis' },
      { ...mockQuadraResponse, id: 2, modalidade: 'Futebol' },
      { ...mockQuadraResponse, id: 3, modalidade: 'Tênis' }
    ];

    service.obterModalidades().subscribe((response: any) => {
      expect(response).toEqual(['Tênis', 'Futebol']);
      expect(response.length).toBe(2);
    });

    const req = httpMock.expectOne('/api/quadras');
    req.flush(quadras);
  });

  it('should create FormData correctly', () => {
    const formData = service.criarFormDataParaCadastro(mockQuadraRequest);
    
    expect(formData.get('numero')).toBe('1');
    expect(formData.get('modalidade')).toBe('Tênis');
    expect(formData.get('qtdPessoas')).toBe('4');
  });

  it('should create FormData with image', () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const formData = service.criarFormDataParaCadastro(mockQuadraRequest, mockFile);
    
    expect(formData.get('imagens')).toBe(mockFile);
  });

  it('should handle error when quadra not found', () => {
    service.buscarPorId(999).subscribe({
      next: () => fail('should have failed'),
      error: (error: any) => {
        expect(error.status).toBe(404);
      }
    });

    const req = httpMock.expectOne('/api/quadras/999');
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });
  });

  it('should handle error when creating quadra', () => {
    const formData = service.criarFormDataParaCadastro(mockQuadraRequest);
    
    service.cadastrar(formData).subscribe({
      next: () => fail('should have failed'),
      error: (error: any) => {
        expect(error.status).toBe(400);
      }
    });

    const req = httpMock.expectOne('/api/quadras');
    req.flush('Validation error', { status: 400, statusText: 'Bad Request' });
  });
});
