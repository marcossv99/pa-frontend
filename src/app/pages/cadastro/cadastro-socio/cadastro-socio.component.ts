import { Component } from '@angular/core';
import { CadastroParcialDTO, CadastroDadosService } from '../../../services/cadastro-dados.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CadastroServiceService } from '../../../services/cadastro-service.service';
import { CadastroBaseService } from '../../../services/cadastro-base.service';

@Component({
  selector: 'app-cadastro-socio',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './cadastro-socio.component.html',
  styleUrl: './cadastro-socio.component.css'
})
export class CadastroSocioComponent {
  dadosCadastro: CadastroParcialDTO = {
    nome: '',
    cpf: '',
    email: '',
    telefone: ''
  };

  constructor(
    private router: Router,
    private cadastroService: CadastroServiceService,
    private cadastroDadosService: CadastroDadosService,
    private cadastroBaseService: CadastroBaseService
  ) { }

  // Botão "Próximo"
  proximoPasso() {
    // Salva dados parciais e navega para a página de senha
    this.cadastroDadosService.setDados(this.dadosCadastro);
    this.router.navigate(['/cadastro/senha']);
  }

  // Botões X (limpar campo)
  limparCampo(campo: keyof CadastroParcialDTO) {
    this.dadosCadastro[campo] = '';
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
}
