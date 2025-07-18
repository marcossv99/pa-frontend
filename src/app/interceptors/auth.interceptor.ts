import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  
  // Verificar se estamos no navegador (não no SSR)
  if (isPlatformBrowser(platformId)) {
    // Obter token do localStorage
    const token = localStorage.getItem('token');
    
    // Se existe token, adicionar ao header Authorization
    if (token) {
      const authRequest = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next(authRequest);
    }
  }
  
  // Se não há token ou não é navegador, prosseguir sem modificar
  return next(req);
};
