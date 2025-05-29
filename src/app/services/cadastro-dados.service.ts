import { Injectable } from '@angular/core';
import { SocioCadastroDTO } from './cadastro-service.service';

export interface CadastroParcialDTO {
  nomeCompleto: string;
  cpf: string;
  email: string;
  telefone: string;
  senha: string;
}


@Injectable({
  providedIn: 'root'
})
export class CadastroDadosService {
  private dadosParciais: CadastroParcialDTO | null = null;

  setDados(dados: CadastroParcialDTO) {
    this.dadosParciais = dados;
  }
  getDados(): SocioCadastroDTO | null {
    return this.dadosParciais;
  }
  limparDados() {
    this.dadosParciais = null;
  }
  constructor() { }
}
