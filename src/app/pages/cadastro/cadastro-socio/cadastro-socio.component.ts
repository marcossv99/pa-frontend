import { Component } from '@angular/core';
import { CadastroParcialDTO, CadastroDadosService } from '../../../services/cadastro-dados.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // necessário para usar ngModel
import { CommonModule } from '@angular/common'; // necessário para usar ngIf

@Component({
  selector: 'app-cadastro-socio',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './cadastro-socio.component.html',
  styleUrl: './cadastro-socio.component.css'
})
export class CadastroSocioComponent {
  dadosCadastro: CadastroParcialDTO = {
    nomeCompleto: '',
    cpf: '',
    email: '',
    telefone: '',
    senha: ''
  };

  constructor(
    private router: Router,
    private cadastroDadosService: CadastroDadosService,
  ) { }

  // Botão "Próximo"
  proximoPasso() {
    this.cadastroDadosService.setDados(this.dadosCadastro);
    this.router.navigate(['/cadastro-senha']);
  }

  // Botões X (limpar campo)
  limparCampo(campo: keyof CadastroParcialDTO) {
    this.dadosCadastro[campo] = '';
  }
}
