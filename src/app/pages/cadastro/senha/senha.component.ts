import { Component, OnInit } from '@angular/core';
import { CadastroServiceService, SocioCadastroDTO } from '../../../services/cadastro-service.service';
import { Router } from '@angular/router';
import { CadastroDadosService } from '../../../services/cadastro-dados.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // necessário para usar ngModel


@Component({
  selector: 'app-senha',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './senha.component.html',
  styleUrl: './senha.component.css'
})
export class SenhaComponent implements OnInit {
  senha: string = '';
  confirmarSenha: string = '';
  socioParcial: Omit<SocioCadastroDTO, 'senha'> | null = null;

  constructor(
    private cadastroService: CadastroServiceService,
    private cadastroDadosService: CadastroDadosService,
    private router: Router
  ) {}

  // Método chamado quando o componente é inicializado
  // Aqui você pode verificar se os dados parciais existem
  ngOnInit() {
    this.socioParcial = this.cadastroDadosService.getDados();

    if (!this.socioParcial) {
      // Se os dados não existem, volta para a primeira etapa
      this.router.navigate(['/cadastro']);
    }
  }

  confirmarCadastro() {
    if (this.senha !== this.confirmarSenha) {
      alert('As senhas não coincidem.');
      return;
    }

    if (this.socioParcial) {
      const socio: SocioCadastroDTO = {
        ...this.socioParcial,
        senha: this.senha
      };

      this.cadastroService.cadastrarSocio(socio).subscribe({
        next: (response) => {
          console.log('Cadastro realizado com sucesso:', response);
          alert('Cadastro realizado com sucesso!');
          this.cadastroDadosService.limparDados();
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Erro ao cadastrar:', error);
          alert('Erro ao cadastrar o usuário.');
        }
      });
    }
  }

  voltar() {
    this.router.navigate(['/cadastro']);
  }
}