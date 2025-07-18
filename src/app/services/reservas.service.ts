import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ReservaRequest {
  usuarioId?: number; // Tornar opcional para quando não há login
  quadraId: number;
  data: string; // YYYY-MM-DD
  horaInicio: number;
  horaFim: number;
  membros: string[];
}

export interface ReservaResponse {
  id: number;
  usuarioId: number;
  usuarioNome: string;
  usuarioFotoPerfil?: string; // Adicionar foto do usuário
  quadraId: number;
  quadraNome: string;
  horarioId: number;
  data: string; // YYYY-MM-DD
  horaInicio: number;
  horaFim: number;
  membros: string[];
  status?: string; // Adicionar status opcional
  
  // Campos para cancelamento
  cancelada?: boolean;
  motivoCancelamento?: string;
  canceladaPor?: string;
  dataCancelamento?: string;
}

export interface ReservaPaginationParams {
  page: number;
  size: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface ReservaFilter {
  usuarioNome?: string;
  quadraNome?: string;
  dataInicio?: string;
  dataFim?: string;
  status?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface ReservaUpdateRequest {
  horaInicio: number;
  horaFim: number;
  membros?: string[]; // Lista de convidados (opcional)
}

@Injectable({ providedIn: 'root' })
export class ReservasService {
  private readonly apiUrl = '/api/reservas';

  constructor(private http: HttpClient) {}

  criar(reserva: ReservaRequest): Observable<ReservaResponse> {
    return this.http.post<ReservaResponse>(this.apiUrl, reserva);
  }

  listar(): Observable<ReservaResponse[]> {
    // ATENÇÃO: Este endpoint foi desabilitado no backend por questões de segurança
    // Use listarPorUsuario(usuarioId) para reservas específicas
    // ou listarTodasParaAdmin() apenas para administradores
    return this.http.get<ReservaResponse[]>(this.apiUrl);
  }

  // Método específico para administradores
  listarTodasParaAdmin(): Observable<ReservaResponse[]> {
    return this.http.get<ReservaResponse[]>(`${this.apiUrl}/admin/todas`);
  }

  listarPaginado(params: ReservaPaginationParams, filter?: ReservaFilter): Observable<PaginatedResponse<ReservaResponse>> {
    // ATENÇÃO: Este método deve ser usado APENAS por associados comuns
    // Para administradores, usar listarPaginadoParaAdmin()
    // Como o backend não tem endpoint paginado específico para usuário, 
    // vamos implementar no frontend usando listarPorUsuario()
    
    // Este método não deve ser usado diretamente - deve ser chamado através de um componente
    // que já tenha o usuarioId disponível
    throw new Error('Use listarPaginadoPorUsuario(usuarioId, params, filter) em vez de listarPaginado()');
  }

  // Novo método para listar reservas paginadas de um usuário específico
  listarPaginadoPorUsuario(usuarioId: number, params: ReservaPaginationParams, filter?: ReservaFilter): Observable<PaginatedResponse<ReservaResponse>> {
    return this.listarPorUsuario(usuarioId).pipe(
      map((data: ReservaResponse[]) => {
        let filteredData = data;
        
        // Aplicar filtros
        if (filter) {
          if (filter.usuarioNome) {
            filteredData = filteredData.filter((item: ReservaResponse) => 
              item.usuarioNome?.toLowerCase().includes(filter.usuarioNome!.toLowerCase())
            );
          }
          if (filter.quadraNome) {
            filteredData = filteredData.filter((item: ReservaResponse) => 
              item.quadraNome?.toLowerCase().includes(filter.quadraNome!.toLowerCase())
            );
          }
          if (filter.dataInicio) {
            filteredData = filteredData.filter((item: ReservaResponse) => 
              item.data >= filter.dataInicio!
            );
          }
          if (filter.dataFim) {
            filteredData = filteredData.filter((item: ReservaResponse) => 
              item.data <= filter.dataFim!
            );
          }
          if (filter.status) {
            // Implementar lógica de status se necessário
          }
        }
        
        // Aplicar ordenação
        if (params.sort) {
          filteredData.sort((a: any, b: any) => {
            const direction = params.direction === 'desc' ? -1 : 1;
            const sortField = params.sort!;
            
            if (a[sortField] < b[sortField]) return -1 * direction;
            if (a[sortField] > b[sortField]) return 1 * direction;
            return 0;
          });
        }
        
        // Aplicar paginação
        const totalElements = filteredData.length;
        const totalPages = Math.ceil(totalElements / params.size);
        const startIndex = params.page * params.size;
        const endIndex = startIndex + params.size;
        const content = filteredData.slice(startIndex, endIndex);
        
        return {
          content,
          totalElements,
          totalPages,
          size: params.size,
          number: params.page,
          first: params.page === 0,
          last: params.page >= totalPages - 1
        };
      })
    );
  }

  // Método específico para administradores com paginação
  listarPaginadoParaAdmin(params: ReservaPaginationParams, filter?: ReservaFilter): Observable<PaginatedResponse<ReservaResponse>> {
    // Usar endpoint específico para admin que retorna todas as reservas do sistema
    return this.listarTodasParaAdmin().pipe(
      map((data: ReservaResponse[]) => {
        let filteredData = data;
        
        // Aplicar filtros
        if (filter) {
          if (filter.usuarioNome) {
            filteredData = filteredData.filter((item: ReservaResponse) => 
              item.usuarioNome?.toLowerCase().includes(filter.usuarioNome!.toLowerCase())
            );
          }
          if (filter.quadraNome) {
            filteredData = filteredData.filter((item: ReservaResponse) => 
              item.quadraNome?.toLowerCase().includes(filter.quadraNome!.toLowerCase())
            );
          }
          if (filter.dataInicio) {
            filteredData = filteredData.filter((item: ReservaResponse) => 
              item.data >= filter.dataInicio!
            );
          }
          if (filter.dataFim) {
            filteredData = filteredData.filter((item: ReservaResponse) => 
              item.data <= filter.dataFim!
            );
          }
          if (filter.status) {
            // Implementar lógica de status se necessário
          }
        }
        
        // Aplicar ordenação
        if (params.sort) {
          filteredData.sort((a: any, b: any) => {
            const direction = params.direction === 'desc' ? -1 : 1;
            const sortField = params.sort!;
            
            if (a[sortField] < b[sortField]) return -1 * direction;
            if (a[sortField] > b[sortField]) return 1 * direction;
            return 0;
          });
        }
        
        // Aplicar paginação
        const totalElements = filteredData.length;
        const totalPages = Math.ceil(totalElements / params.size);
        const startIndex = params.page * params.size;
        const endIndex = startIndex + params.size;
        const content = filteredData.slice(startIndex, endIndex);
        
        return {
          content,
          totalElements,
          totalPages,
          size: params.size,
          number: params.page,
          first: params.page === 0,
          last: params.page >= totalPages - 1
        };
      })
    );
  }

  listarPorUsuario(usuarioId: number): Observable<ReservaResponse[]> {
    return this.http.get<ReservaResponse[]>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  buscarPorId(id: number): Observable<ReservaResponse> {
    return this.http.get<ReservaResponse>(`${this.apiUrl}/${id}`);
  }


  atualizar(id: number, reserva: ReservaUpdateRequest): Observable<ReservaResponse> {
    return this.http.put<ReservaResponse>(`${this.apiUrl}/${id}`, reserva);
  }

  editar(id: number, dadosReserva: ReservaUpdateRequest): Observable<ReservaResponse> {
    return this.http.put<ReservaResponse>(`${this.apiUrl}/${id}`, dadosReserva);
  }

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  cancelarPorAdmin(id: number, motivo: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/cancelar-admin`, { motivo });
  }

  // Métodos auxiliares
  obterReservasPorData(usuarioId: number, data: string): Observable<ReservaResponse[]> {
    return this.listarPorUsuario(usuarioId).pipe(
      map(reservas => reservas.filter(reserva => reserva.data === data))
    );
  }

  verificarDisponibilidadeHorario(quadraId: number, data: string, horaInicio: number, horaFim: number): Observable<boolean> {
    return this.listar().pipe(
      map(reservas => {
        const conflitos = reservas.filter(reserva => 
          reserva.quadraId === quadraId && 
          reserva.data === data &&
          this.verificarConflitorHorario(reserva.horaInicio, reserva.horaFim, horaInicio, horaFim)
        );
        return conflitos.length === 0;
      })
    );
  }

  formatarDataParaExibicao(data: string): string {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  formatarHorario(hora: number): string {
    const horas = Math.floor(hora);
    const minutos = (hora - horas) * 60;
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  }

  private verificarConflitorHorario(inicio1: number, fim1: number, inicio2: number, fim2: number): boolean {
    return !(fim1 <= inicio2 || inicio1 >= fim2);
  }
}
