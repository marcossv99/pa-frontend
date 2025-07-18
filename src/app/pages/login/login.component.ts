import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  cpfOuEmail: string = '';
  senha: string = '';
  msg: string = '';
  lembrarDeMim: boolean = false;
  // Adicionei a propriedade lembrarDeMim para armazenar o estado do checkbox
  mostrarSenha: boolean = false;
  
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    // Preencher automaticamente se lembrarDeMim estiver setado (SSR-safe)
    if (typeof window !== 'undefined' && window.localStorage) {
      const lembrado = localStorage.getItem('lembrarDeMim');
      if (lembrado === 'true') {
        this.lembrarDeMim = true;
        const loginSalvo = localStorage.getItem('loginSalvo');
        if (loginSalvo) {
          this.cpfOuEmail = loginSalvo;
        }
      }
    }
  }

  fazerLogin() {
    if (!this.cpfOuEmail || !this.senha) {
      this.msg = 'Preencha todos os campos.';
      return;
    }
    // Lógica lembrar de mim (SSR-safe)
    if (typeof window !== 'undefined' && window.localStorage) {
      if (this.lembrarDeMim) {
        localStorage.setItem('lembrarDeMim', 'true');
        localStorage.setItem('loginSalvo', this.cpfOuEmail);
      } else {
        localStorage.removeItem('lembrarDeMim');
        localStorage.removeItem('loginSalvo');
      }
    }
    const loginData = {
      email: this.cpfOuEmail,
      senha: this.senha
    };
    this.authService.login(loginData).subscribe({
      next: (response) => {
        console.log('Login realizado com sucesso:', response);
        this.msg = '';
        setTimeout(() => {
          if (response.isAdmin) {
            this.router.navigate(['/admin/home']);
          } else {
            this.router.navigate(['/socio/home']);
          }
        }, 100);
      },
      error: (error) => {
        console.error('Login falhou:', error);
        this.msg = 'Login falhou. Cheque suas credenciais.';
      }
    });
  }
  toggleMostrarSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }
  irParaCadastro() {
    this.router.navigate(['/cadastro']);
  }

  // Máscara de CPF para login
  formatarCpf(cpf: string): string {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length > 11) cpf = cpf.slice(0, 11);
    if (cpf.length > 9) return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    if (cpf.length > 6) return cpf.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    if (cpf.length > 3) return cpf.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    return cpf;
  }

  // Detecta se é CPF (só dígitos, 11 caracteres)
  isCpf(valor: string): boolean {
    return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(valor) || valor.replace(/\D/g, '').length === 11;
  }
}
