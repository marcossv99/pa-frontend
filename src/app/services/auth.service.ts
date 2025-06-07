import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

// frontend/src/app/services/auth.service.ts
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth/login';

  constructor(private http: HttpClient) { }

  login(login: string, senha: string) {
    let body: any = { senha };
    if (login.includes('@')) {
      body.email = login;
    } else {
      body.cpf = login;
    }
    return this.http.post(this.apiUrl, body, { responseType: 'text' });
  }
}