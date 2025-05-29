import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

// frontend/src/app/services/auth.service.ts
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://spring-backend:8080/api/auth/login';

  constructor(private http: HttpClient) { }

  login(cpfOuEmail: string, senha: string) {
    return this.http.post(this.apiUrl, { cpfOuEmail, senha }, { responseType: 'text' });
  }
}