import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SocioGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    console.log('[SocioGuard] Verificando acesso à rota sócio:', state.url);
    
    // Se não estamos no navegador (SSR), bloquear acesso
    if (!isPlatformBrowser(this.platformId)) {
      console.log('[SocioGuard] Não está no navegador - bloqueando acesso');
      return false;
    }

    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('clubesportivo_usuario');
    
    console.log('[SocioGuard] Token no localStorage:', token ? 'SIM' : 'NÃO');
    console.log('[SocioGuard] Dados do usuário no localStorage:', userData ? 'SIM' : 'NÃO');
    
    if (!token) {
      console.log('[SocioGuard] Sem token - redirecionando para login');
      this.router.navigate(['/login']);
      return false;
    }

    // Se há token mas não há dados do usuário, restaurar do backend
    if (!userData) {
      console.log('[SocioGuard] Token presente mas sem dados do usuário - restaurando do backend...');
      return this.authService.obterPerfil().pipe(
        map(response => {
          console.log('[SocioGuard] Dados do usuário restaurados:', response);
          
          // Salvar os dados no localStorage
          localStorage.setItem('clubesportivo_usuario', JSON.stringify(response));
          
          // Verificar se é admin
          if (response.isAdmin) {
            console.log('[SocioGuard] Usuário é admin - redirecionando para home de admin');
            this.router.navigate(['/admin/home']);
            return false;
          }
          
          console.log('[SocioGuard] Usuário é sócio - permitindo acesso');
          return true;
        }),
        catchError(error => {
          console.log('[SocioGuard] Erro ao restaurar dados do usuário - redirecionando para login');
          this.authService.logout();
          return of(false);
        })
      );
    }

    try {
      const usuario = JSON.parse(userData);
      console.log('[SocioGuard] Usuário logado:', usuario.nome, 'isAdmin:', usuario.isAdmin);
      
      // Verificar se é sócio (não admin)
      if (usuario.isAdmin) {
        console.log('[SocioGuard] Usuário é admin - redirecionando para home de admin');
        this.router.navigate(['/admin/home']);
        return false;
      }

      // Validar token no backend
      console.log('[SocioGuard] Validando token no backend...');
      return this.authService.validarToken().pipe(
        map(response => {
          console.log('[SocioGuard] Token válido - permitindo acesso');
          return true;
        }),
        catchError(error => {
          console.log('[SocioGuard] Token inválido - limpando dados e redirecionando');
          this.authService.logout();
          return of(false);
        })
      );

    } catch (error) {
      console.log('[SocioGuard] Erro ao processar dados do usuário - redirecionando para login');
      this.authService.logout();
      return false;
    }
  }
}
