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
@Injectable({
  providedIn: 'root'
})

export class CadastroServiceService {
  private apiUrl = '/api/associados'; // Usando proxy para evitar CORS
  constructor(private http: HttpClient) { }

  cadastrarSocio(dados: SocioCadastroDTO): Observable<any> {
    // Garante que isAdmin seja enviado (padrão false)
    return this.http.post(this.apiUrl, { ...dados, isAdmin: false }, { responseType: 'text' });
  }
}
