import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AssociadoCadastroDto {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  senha: string;
  isAdmin?: boolean;
}

export interface PaginationParams {
  page: number;
  size: number;
  sort?: string;
  direction?: 'asc' | 'desc';
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

export interface AssociadoFilter {
  nome?: string;
  email?: string;
  cpf?: string;
  isAdmin?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AssociadoService {
  private readonly apiUrl = '/api/associados';
  private dadosTemporarios: Partial<AssociadoCadastroDto> | null = null;

  constructor(private http: HttpClient) { }

  cadastrar(dados: AssociadoCadastroDto): Observable<any> {
    const payload = { ...dados, isAdmin: dados.isAdmin ?? false };
    return this.http.post(this.apiUrl, payload, { responseType: 'text' });
  }

  listar(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  listarPaginado(params: PaginationParams, filter?: AssociadoFilter): Observable<PaginatedResponse<any>> {
    // Como o backend não tem endpoint paginado, vamos listar todos e paginar no frontend
    return this.listar().pipe(
      map((data: any[]) => {
        let filteredData = data;
        
        // Aplicar filtros
        if (filter) {
          if (filter.nome) {
            filteredData = filteredData.filter((item: any) => 
              item.nome?.toLowerCase().includes(filter.nome!.toLowerCase())
            );
          }
          if (filter.email) {
            filteredData = filteredData.filter((item: any) => 
              item.email?.toLowerCase().includes(filter.email!.toLowerCase())
            );
          }
          if (filter.cpf) {
            filteredData = filteredData.filter((item: any) => 
              item.cpf?.includes(filter.cpf!)
            );
          }
          if (filter.isAdmin !== undefined) {
            filteredData = filteredData.filter((item: any) => 
              item.isAdmin === filter.isAdmin
            );
          }
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

  buscarPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  editar(id: number, dados: Partial<AssociadoCadastroDto>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dados);
  }

  // Métodos para gerenciar dados temporários durante o fluxo de cadastro
  salvarDadosTemporarios(dados: Partial<AssociadoCadastroDto>): void {
    this.dadosTemporarios = dados;
  }

  obterDadosTemporarios(): Partial<AssociadoCadastroDto> | null {
    return this.dadosTemporarios;
  }

  limparDadosTemporarios(): void {
    this.dadosTemporarios = null;
  }

  // Validações
  validarCpf(cpf: string): boolean {
    return !!(cpf && cpf.length >= 11);
  }

  validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validarTelefone(telefone: string): boolean {
    return !!(telefone && telefone.length >= 10);
  }
}
