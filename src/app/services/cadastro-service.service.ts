import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


export interface SocioCadastroDTO {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  senha: string;
  isAdmin?: boolean;
}

export interface UsuarioCadastroDTO {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  senha: string;
  isAdmin: boolean;
}
@Injectable({
  providedIn: 'root'
})

export class CadastroServiceService {
  private apiUrl = '/api/associados'; // Usando proxy para evitar CORS
  private authApiUrl = '/api/auth'; // Para endpoints de autenticação
  
  constructor(private http: HttpClient) { }

  cadastrarSocio(dados: SocioCadastroDTO): Observable<any> {
    // Garante que isAdmin seja enviado (padrão false)
    return this.http.post(`${this.authApiUrl}/cadastrar-associado`, { ...dados, isAdmin: false }, { responseType: 'text' });
  }

  cadastrarUsuario(dados: UsuarioCadastroDTO): Observable<any> {
    // Cadastra usuário com isAdmin definido explicitamente
    if (dados.isAdmin) {
      // Se é admin, usar endpoint específico para admin
      return this.http.post(`${this.authApiUrl}/cadastrar-admin`, dados, { responseType: 'text' });
    } else {
      // Se é associado, usar endpoint para associado
      return this.http.post(`${this.authApiUrl}/cadastrar-associado`, dados, { responseType: 'text' });
    }
  }
}
