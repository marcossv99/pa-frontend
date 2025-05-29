import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


export interface SocioCadastroDTO {
  nomeCompleto: string;
  cpf: string;
  email: string;
  telefone: string;
  senha: string;
}
@Injectable({
  providedIn: 'root'
})

export class CadastroServiceService {
  private apiUrl = 'http://localhost:8080/api/socios/cadastro';
  constructor(private http: HttpClient) { }

  cadastrarSocio(dados: SocioCadastroDTO): Observable<any> {
    return this.http.post(this.apiUrl, dados, { responseType: 'text' });
  }
}
