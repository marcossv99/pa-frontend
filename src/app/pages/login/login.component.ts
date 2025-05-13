import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
  
  constructor(private authService: AuthService) {}

  fazerLogin() {
    this.authService.login(this.cpfOuEmail, this.senha).subscribe({
      next: (response) => {
        console.log('Login realizado com sucesso:', response);
        
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
}
