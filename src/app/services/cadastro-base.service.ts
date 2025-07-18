import { Injectable } from '@angular/core';

export interface CadastroUsuarioDTO {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  senha: string;
  isAdmin: boolean;
}

export interface CadastroParcialUsuarioDTO {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  senha: string;
}

@Injectable({
  providedIn: 'root'
})
export class CadastroBaseService {
  
  constructor() { }

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

  // Validação de CPF
  cpfValido(cpf: string): boolean {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validação do primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    
    // Validação do segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;
    
    return true;
  }

  // Validação de telefone
  telefoneValido(telefone: string): boolean {
    const telefoneLimpo = telefone.replace(/\D/g, '');
    return telefoneLimpo.length === 10 || telefoneLimpo.length === 11;
  }

  // Validação de senha
  senhaValida(senha: string): boolean {
    return senha.length >= 6;
  }

  // Validação completa dos dados
  validarDados(dados: CadastroParcialUsuarioDTO): string[] {
    const erros: string[] = [];
    
    if (!dados.nome.trim()) {
      erros.push('Nome é obrigatório');
    }
    
    if (!dados.cpf.trim()) {
      erros.push('CPF é obrigatório');
    } else if (!this.cpfValido(dados.cpf)) {
      erros.push('CPF inválido');
    }
    
    if (!dados.email.trim()) {
      erros.push('Email é obrigatório');
    } else if (!this.emailValido(dados.email)) {
      erros.push('Email inválido');
    }
    
    if (!dados.telefone.trim()) {
      erros.push('Telefone é obrigatório');
    } else if (!this.telefoneValido(dados.telefone)) {
      erros.push('Telefone inválido');
    }
    
    if (!dados.senha.trim()) {
      erros.push('Senha é obrigatória');
    } else if (!this.senhaValida(dados.senha)) {
      erros.push('Senha deve ter pelo menos 6 caracteres');
    }
    
    return erros;
  }
}
