import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CadastroBaseService, CadastroParcialUsuarioDTO } from '../../../services/cadastro-base.service';
import { AuthService, CadastroAssociadoRequest } from '../../../services/auth.service';

@Component({
  selector: 'app-cadastro-admin',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './cadastro-admin.component.html',
  styleUrl: './cadastro-admin.component.css'
})
export class CadastroAdminComponent implements OnInit {
  
  dadosCadastro: CadastroParcialUsuarioDTO = {
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    senha: ''
  };

  confirmacaoSenha: string = '';
  mostrarSenha: boolean = false;
  mostrarConfirmacaoSenha: boolean = false;
  carregando: boolean = false;
  erro: string = '';
  sucesso: string = '';

  constructor(
    private router: Router,
    private cadastroBaseService: CadastroBaseService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Componente inicializado
  }

  // Delegação para o service base - eliminando redundância
  formatarCpf(cpf: string): string {
    return this.cadastroBaseService.formatarCpf(cpf);
  }

  formatarTelefone(telefone: string): string {
    return this.cadastroBaseService.formatarTelefone(telefone);
  }

  emailValido(email: string): boolean {
    return this.cadastroBaseService.emailValido(email);
  }

  cpfValido(cpf: string): boolean {
    return this.cadastroBaseService.cpfValido(cpf);
  }

  telefoneValido(telefone: string): boolean {
    return this.cadastroBaseService.telefoneValido(telefone);
  }

  senhaValida(senha: string): boolean {
    return this.cadastroBaseService.senhaValida(senha);
  }

  // Limpeza de campos
  limparCampo(campo: keyof CadastroParcialUsuarioDTO | 'confirmacaoSenha'): void {
    if (campo === 'confirmacaoSenha') {
      this.confirmacaoSenha = '';
    } else {
      this.dadosCadastro[campo] = '';
    }
  }

  // Validação de confirmação de senha
  senhasConferem(): boolean {
    return this.dadosCadastro.senha === this.confirmacaoSenha;
  }

  // Toggle visibilidade da senha
  toggleMostrarSenha(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }

  toggleMostrarConfirmacaoSenha(): void {
    this.mostrarConfirmacaoSenha = !this.mostrarConfirmacaoSenha;
  }

  // Validação do formulário
  formularioValido(): boolean {
    const erros = this.cadastroBaseService.validarDados(this.dadosCadastro);
    return erros.length === 0 && this.senhasConferem();
  }

  // Submissão do formulário
  async cadastrarAdmin(): Promise<void> {
    this.erro = '';
    this.sucesso = '';

    // Validação
    const erros = this.cadastroBaseService.validarDados(this.dadosCadastro);
    if (erros.length > 0) {
      this.erro = erros[0];
      return;
    }

    if (!this.senhasConferem()) {
      this.erro = 'Senhas não conferem';
      return;
    }

    this.carregando = true;

    try {
      // Prepara dados para cadastro como admin
      const dadosCompletos: CadastroAssociadoRequest = {
        nome: this.dadosCadastro.nome,
        cpf: this.dadosCadastro.cpf,
        email: this.dadosCadastro.email,
        telefone: this.dadosCadastro.telefone,
        senha: this.dadosCadastro.senha
      };

      // Chama o AuthService para cadastrar admin
      await this.authService.cadastrarAdmin(dadosCompletos).toPromise();
      
      this.sucesso = 'Administrador cadastrado com sucesso!';
      
      // Redireciona após 2 segundos
      setTimeout(() => {
        this.router.navigate(['/admin/home']);
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao cadastrar admin:', error);
      this.erro = error.error?.error || error.error?.message || 'Erro ao cadastrar administrador. Tente novamente.';
    } finally {
      this.carregando = false;
    }
  }

  // Cancelar e voltar
  cancelar(): void {
    this.router.navigate(['/admin/home']);
  }
}
