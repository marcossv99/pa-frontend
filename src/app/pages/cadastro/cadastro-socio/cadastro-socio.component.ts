import { Component } from '@angular/core';
import { CadastroParcialDTO, CadastroDadosService } from '../../../services/cadastro-dados.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // necessário para usar ngModel
import { CommonModule } from '@angular/common'; // necessário para usar ngIf
import { CadastroServiceService } from '../../../services/cadastro-service.service';

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
    telefone: '',
    senha: ''
  };

  constructor(
    private router: Router,
    private cadastroService: CadastroServiceService, // injeta o service correto
    private cadastroDadosService: CadastroDadosService // injeta o service de dados
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
  // Máscara de CPF
  formatarCpf(cpf: string): string {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length > 11) cpf = cpf.slice(0, 11);
    if (cpf.length > 9) return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    if (cpf.length > 6) return cpf.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    if (cpf.length > 3) return cpf.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    return cpf;
  }

  // Máscara de telefone
  formatarTelefone(telefone: string): string {
    telefone = telefone.replace(/\D/g, '');
    if (telefone.length > 11) telefone = telefone.slice(0, 11);
    if (telefone.length > 10) return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (telefone.length > 6) return telefone.replace(/(\d{2})(\d{4,5})(\d{0,4})/, '($1) $2-$3');
    if (telefone.length > 2) return telefone.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    return telefone;
  }

  // Validação simples de email
  emailValido(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
