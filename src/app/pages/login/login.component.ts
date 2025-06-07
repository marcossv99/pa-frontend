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

  fazerLogin() {
    if (!this.cpfOuEmail || !this.senha) {
      this.msg = 'Preencha todos os campos.';
      return;
    }
    this.authService.login(this.cpfOuEmail, this.senha).subscribe({
      next: (response) => {
        console.log('Login realizado com sucesso:', response);
        this.msg = '';
        this.router.navigate(['/home']); // redireciona para o componente Home
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
