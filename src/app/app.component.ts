import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AuthService } from './services/auth.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'front';

  constructor(
    private authService: AuthService, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    // Só executar no browser
    if (isPlatformBrowser(this.platformId)) {
      console.log('[AppComponent] Aplicação iniciada no navegador');
      
      // Verificar se há tentativa de acesso a rota protegida sem autenticação
      const currentUrl = this.router.url;
      console.log('[AppComponent] URL atual:', currentUrl);
      
      // Se está tentando acessar uma rota protegida sem estar logado
      if ((currentUrl.startsWith('/admin') || currentUrl.startsWith('/socio')) && !this.authService.isLogado()) {
        console.log('[AppComponent] Tentativa de acesso a rota protegida sem login - redirecionando');
        this.router.navigate(['/login']);
      }
    }
  }
}
