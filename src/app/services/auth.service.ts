import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface CadastroAssociadoRequest {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  cpf: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  nome: string;
  email: string;
  isAdmin: boolean;
  telefone?: string;
  fotoPerfil?: string;
}

export interface UsuarioLogado {
  userId: number;
  nome: string;
  email: string;
  isAdmin: boolean;
  telefone?: string;
  fotoPerfil?: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = '/api/auth';
  private readonly STORAGE_KEY = 'auth_user';
  
  private usuarioLogadoSubject = new BehaviorSubject<UsuarioLogado | null>(null);
  public usuarioLogado$ = this.usuarioLogadoSubject.asObservable();

  constructor(
    private http: HttpClient, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Verificar se há usuário logado no localStorage ao inicializar
    // Só no browser (não no SSR)
    if (isPlatformBrowser(this.platformId)) {
      this.verificarUsuarioLogado();
    }
  }

  private verificarUsuarioLogado() {
    // Só executar no browser, não no SSR
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const userData = localStorage.getItem(this.STORAGE_KEY);
    const token = localStorage.getItem('token');
    
    console.log('[AuthService] Verificando usuário logado...');
    console.log('[AuthService] Dados do usuário:', userData ? 'SIM' : 'NÃO');
    console.log('[AuthService] Token:', token ? 'SIM' : 'NÃO');
    
    if (userData && token) {
      try {
        const usuario: UsuarioLogado = JSON.parse(userData);
        console.log('[AuthService] Usuário encontrado:', usuario.nome, 'isAdmin:', usuario.isAdmin);
        
        // Validar token no backend
        this.validarToken().subscribe({
          next: (response) => {
            console.log('[AuthService] Token validado com sucesso');
            this.usuarioLogadoSubject.next(usuario);
          },
          error: (error) => {
            console.log('[AuthService] Token inválido - fazendo logout:', error);
            this.limparDadosLocais();
          }
        });
      } catch (error) {
        console.log('[AuthService] Erro ao processar dados do usuário:', error);
        this.limparDadosLocais();
      }
    } else {
      console.log('[AuthService] Sem dados de usuário ou token - limpando dados');
      this.limparDadosLocais();
    }
  }

  private limparDadosLocais() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem('token');
      console.log('[AuthService] Dados locais limpos');
    }
    this.usuarioLogadoSubject.next(null);
  }

  login(dados: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, dados).pipe(
      tap(response => {
        const usuario: UsuarioLogado = {
          userId: response.userId,
          nome: response.nome,
          email: response.email,
          isAdmin: response.isAdmin,
          telefone: response.telefone,
          fotoPerfil: response.fotoPerfil,
          token: response.token
        };
        
        // Salvar no localStorage (só no browser)
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usuario));
          localStorage.setItem('token', response.token); // Salvar também o token separadamente
        }
        
        // Atualizar BehaviorSubject
        this.usuarioLogadoSubject.next(usuario);
        
        console.log('Login realizado com sucesso:', usuario.nome, 'isAdmin:', usuario.isAdmin);
      }),
      catchError(error => {
        console.error('Erro no login:', error);
        return throwError(() => error);
      })
    );
  }

  cadastrarAssociado(dados: CadastroAssociadoRequest): Observable<AuthResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<AuthResponse>(`${this.apiUrl}/cadastrar-associado`, dados, { headers });
  }

  cadastrarAdmin(dados: CadastroAssociadoRequest): Observable<AuthResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<AuthResponse>(`${this.apiUrl}/cadastrar-admin`, dados, { headers });
  }

  validarToken(): Observable<AuthResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<AuthResponse>(`${this.apiUrl}/validar-token`, {}, { headers });
  }

  logout(): void {
    const headers = this.getAuthHeaders();
    
    // Tentar notificar o backend (opcional)
    this.http.post(`${this.apiUrl}/logout`, {}, { headers }).subscribe({
      complete: () => {
        this.finalizarLogout();
      },
      error: () => {
        this.finalizarLogout();
      }
    });
  }

  private finalizarLogout(): void {
    this.limparDadosLocais();
    this.router.navigate(['/login']);
    console.log('Logout realizado');
  }

  private getAuthHeaders(): HttpHeaders {
    const usuario = this.getUsuarioLogado();
    if (usuario?.token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${usuario.token}`,
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // Métodos auxiliares
  getUsuarioLogado(): UsuarioLogado | null {
    return this.usuarioLogadoSubject.value;
  }

  isLogado(): boolean {
    return this.usuarioLogadoSubject.value !== null;
  }

  isAdmin(): boolean {
    const usuario = this.getUsuarioLogado();
    return usuario?.isAdmin === true;
  }

  isAssociado(): boolean {
    const usuario = this.getUsuarioLogado();
    return usuario?.isAdmin === false;
  }

  getToken(): string | null {
    const usuario = this.getUsuarioLogado();
    return usuario?.token || null;
  }

  // Para uso em guards e interceptors
  getAuthToken(): string | null {
    const usuario = this.getUsuarioLogado();
    return usuario?.token ? `Bearer ${usuario.token}` : null;
  }
  
  // Métodos para perfil do usuário
  obterPerfil(): Observable<AuthResponse> {
    const headers = this.getHeaders();
    return this.http.get<AuthResponse>(`${this.apiUrl}/perfil`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }
  
  atualizarPerfil(dados: any): Observable<AuthResponse> {
    const headers = this.getHeaders();
    return this.http.put<AuthResponse>(`${this.apiUrl}/perfil`, dados, { headers })
      .pipe(
        tap(response => {
          // Atualizar dados do usuário logado
          const usuarioAtual = this.getUsuarioLogado();
          if (usuarioAtual) {
            const usuarioAtualizado: UsuarioLogado = {
              ...usuarioAtual,
              nome: response.nome,
              email: response.email,
              fotoPerfil: response.fotoPerfil
            };
            this.atualizarUsuarioLogado(usuarioAtualizado);
          }
        }),
        catchError(this.handleError)
      );
  }
  
  uploadFotoPerfil(file: File): Observable<{fotoUrl: string}> {
    const headers = this.getHeaders(false); // sem Content-Type para FormData
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<{fotoUrl: string}>(`${this.apiUrl}/perfil/foto`, formData, { headers })
      .pipe(
        tap(response => {
          // Atualizar foto do usuário logado
          const usuarioAtual = this.getUsuarioLogado();
          if (usuarioAtual) {
            const usuarioAtualizado: UsuarioLogado = {
              ...usuarioAtual,
              fotoPerfil: response.fotoUrl
            };
            this.atualizarUsuarioLogado(usuarioAtualizado);
          }
        }),
        catchError(this.handleError)
      );
  }
  
  // Método auxiliar para atualizar usuário logado
  private atualizarUsuarioLogado(usuario: UsuarioLogado) {
    // Salvar no localStorage (só no browser)
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usuario));
    }
    this.usuarioLogadoSubject.next(usuario);
  }
  
  // Método auxiliar para headers com autenticação
  private getHeaders(includeContentType: boolean = true): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    if (includeContentType) {
      headers = headers.set('Content-Type', 'application/json');
    }
    
    return headers;
  }
  
  // Método para tratamento de erros
  private handleError(error: any): Observable<never> {
    console.error('Erro na requisição:', error);
    return throwError(() => error);
  }

  // Método para restaurar usuário do localStorage
  restaurarUsuarioDoLocalStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      const userData = localStorage.getItem(this.STORAGE_KEY);
      if (userData) {
        try {
          const usuario: UsuarioLogado = JSON.parse(userData);
          this.usuarioLogadoSubject.next(usuario);
          console.log('[AuthService] Usuário restaurado do localStorage:', usuario.nome);
        } catch (error) {
          console.error('[AuthService] Erro ao restaurar usuário do localStorage:', error);
          this.limparDadosLocais();
        }
      }
    }
  }

}