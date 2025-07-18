import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthService, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot, 
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    console.log('[AdminGuard] Verificando acesso à rota admin:', state.url);
    
    // Se não estamos no navegador (SSR), bloquear acesso
    if (!isPlatformBrowser(this.platformId)) {
      console.log('[AdminGuard] Não está no navegador - bloqueando acesso');
      return false;
    }

    // Primeiro, tentar obter usuário do serviço
    let usuario = this.authService.getUsuarioLogado();
    
    // Se não há usuário no serviço, tentar restaurar do localStorage
    if (!usuario) {
      console.log('[AdminGuard] Usuário não encontrado no serviço - tentando restaurar do localStorage');
      this.authService.restaurarUsuarioDoLocalStorage();
      usuario = this.authService.getUsuarioLogado();
    }

    // Se ainda não há usuário, verificar localStorage diretamente
    if (!usuario) {
      const userData = localStorage.getItem('clubesportivo_usuario');
      const token = localStorage.getItem('token');
      
      console.log('[AdminGuard] Dados do usuário no localStorage:', userData ? 'SIM' : 'NÃO');
      console.log('[AdminGuard] Token no localStorage:', token ? 'SIM' : 'NÃO');
      
      if (!userData || !token) {
        console.log('[AdminGuard] Sem dados de usuário ou token - redirecionando para login');
        this.router.navigate(['/login']);
        return false;
      }

      try {
        usuario = JSON.parse(userData);
        // Atualizar o serviço com os dados restaurados
        this.authService.restaurarUsuarioDoLocalStorage();
      } catch (error) {
        console.log('[AdminGuard] Erro ao processar dados do usuário - redirecionando para login');
        this.authService.logout();
        return false;
      }
    }

    // Se ainda não há usuário, bloquear acesso
    if (!usuario) {
      console.log('[AdminGuard] Usuário não encontrado - redirecionando para login');
      this.router.navigate(['/login']);
      return false;
    }

    console.log('[AdminGuard] Usuário encontrado:', usuario.nome, 'isAdmin:', usuario.isAdmin);
    
    // Verificar se é admin
    if (!usuario.isAdmin) {
      console.log('[AdminGuard] Usuário não é admin - redirecionando para home de sócio');
      this.router.navigate(['/socio/home']);
      return false;
    }

    // Validar token no backend
    console.log('[AdminGuard] Validando token no backend...');
    return this.authService.validarToken().pipe(
      map(response => {
        console.log('[AdminGuard] Token válido - permitindo acesso');
        return true;
      }),
      catchError(error => {
        console.log('[AdminGuard] Token inválido - limpando dados e redirecionando');
        this.authService.logout();
        return of(false);
      })
    );
  }
}
