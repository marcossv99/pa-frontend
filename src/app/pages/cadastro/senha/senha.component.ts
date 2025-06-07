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
  socioParcial: any = null;

  // Controle do modal
  showModal: boolean = false;
  modalMessage: string = '';
  modalSuccess: boolean = false;

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

  abrirModal(mensagem: string, sucesso: boolean = false) {
    this.modalMessage = mensagem;
    this.showModal = true;
    this.modalSuccess = sucesso;
  }

  fecharModal() {
    this.showModal = false;
    if (this.modalSuccess) {
      this.cadastroDadosService.limparDados();
      this.router.navigate(['/login']);
    }
  }

  confirmarCadastro() {
    if (this.senha.length < 6) {
      this.abrirModal('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (this.senha !== this.confirmarSenha) {
      this.abrirModal('As senhas não coincidem.');
      return;
    }

    if (this.socioParcial) {
      // Monta o objeto completo para o backend
      const socio: SocioCadastroDTO = {
        ...this.socioParcial,
        senha: this.senha,
        isAdmin: false // sempre envia isAdmin
      };

      this.cadastroService.cadastrarSocio(socio).subscribe({
        next: () => {
          this.abrirModal('Cadastro realizado com sucesso!', true);
        },
        error: (error) => {
          this.abrirModal('Erro ao cadastrar o usuário.');
          console.error('Erro ao cadastrar:', error);
        }
      });
    }
  }

  voltar() {
    this.router.navigate(['/cadastro']);
  }
}