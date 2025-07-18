import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ReservaUsuario } from '../interfaces/reserva.interface';

@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  private readonly apiUrl = '/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  obterReservasUsuario(): Observable<ReservaUsuario[]> {
    const headers = this.getHeaders();
    console.log('Fazendo requisição para /api/usuario/reservas com headers:', headers.keys());
    
    return this.http.get<ReservaUsuario[]>(`${this.apiUrl}/usuario/reservas`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Método auxiliar para headers com autenticação
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    console.log('Token obtido do AuthService:', token ? 'Token presente' : 'Token ausente');
    
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
      console.log('Header Authorization adicionado');
    } else {
      console.warn('Token não encontrado - requisição sem autenticação');
    }
    
    return headers;
  }

  // Método para tratamento de erros
  private handleError(error: any): Observable<never> {
    console.error('Erro na requisição de reservas:', error);
    return throwError(() => error);
  }
}
