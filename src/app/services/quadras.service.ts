import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface QuadraRequest {
  numero: number;
  modalidade: string;
  qtdPessoas: number;
}

export interface QuadraResponse extends QuadraRequest {
  id: number;
  img?: string;
  isDisponivel: boolean;
}

export interface DisponibilidadeRequest {
  disponivel: boolean;
}

export interface HorarioDisponivel {
  horaInicio: number;
  horaFim: number;
  data: string;
  disponivel: boolean;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class QuadrasService {
  private readonly apiUrl = '/api/quadras';

  constructor(private http: HttpClient) {}

  listar(): Observable<QuadraResponse[]> {
    return this.http.get<QuadraResponse[]>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<QuadraResponse> {
    return this.http.get<QuadraResponse>(`${this.apiUrl}/${id}`);
  }

  cadastrar(quadra: FormData): Observable<QuadraResponse> {
    return this.http.post<QuadraResponse>(this.apiUrl, quadra);
  }

  editar(id: number, quadra: FormData): Observable<QuadraResponse> {
    return this.http.put<QuadraResponse>(`${this.apiUrl}/${id}`, quadra);
  }

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  alterarDisponibilidade(id: number, disponivel: boolean): Observable<QuadraResponse> {
    const payload: DisponibilidadeRequest = { disponivel };
    return this.http.patch<QuadraResponse>(`${this.apiUrl}/${id}/disponibilidade`, payload);
  }

  // Métodos auxiliares
  obterQuadrasDisponiveis(): Observable<QuadraResponse[]> {
    return this.listar().pipe(
      map(quadras => quadras.filter(quadra => quadra.isDisponivel))
    );
  }

  obterModalidades(): Observable<string[]> {
    return this.listar().pipe(
      map(quadras => [...new Set(quadras.map(quadra => quadra.modalidade))])
    );
  }

  listarHorariosDisponiveis(quadraId: number, data: string): Observable<HorarioDisponivel[]> {
    return this.http.get<HorarioDisponivel[]>(`${this.apiUrl}/${quadraId}/horarios-disponiveis?data=${data}`);
  }

  criarFormDataParaCadastro(dadosQuadra: QuadraRequest, imagem?: File): FormData {
    const formData = new FormData();
    formData.append('numero', dadosQuadra.numero.toString());
    formData.append('modalidade', dadosQuadra.modalidade);
    formData.append('qtdPessoas', dadosQuadra.qtdPessoas.toString());
    
    if (imagem) {
      formData.append('imagens', imagem);
    }
    
    return formData;
  }

  getImageUrl(imageName: string | undefined): string {
    // Se não há nome de imagem, retorna a imagem padrão
    if (!imageName) {
      return '/home-socio/futebol-quadra.png';
    }
    // Se já contém o path completo ou é URL, retorna como está
    if (imageName.includes('/') || imageName.includes('http')) {
      return imageName;
    }
    // Caso contrário, constrói a URL do backend
    return `/api/quadras/imagens/${imageName}`;
  }

  // Método para verificar se o backend está disponível
  verificarConexaoBackend(): Observable<boolean> {
    return this.http.get('/api/quadras/test', { responseType: 'text' }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}
