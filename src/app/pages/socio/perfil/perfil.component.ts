import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ReservaService } from '../../../services/reserva.service';
import { ReservaUsuario } from '../../../interfaces/reserva.interface';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit {
  usuario: any = {};
  reservas: ReservaUsuario[] = [];
  isLoading = false;
  message = '';
  messageType = '';
  fotoPreview: string | null = null;
  selectedFile: File | null = null;

  // Dados do formulário
  nome = '';
  email = '';
  telefone = '';
  senha = '';
  confirmarSenha = '';

  constructor(
    private authService: AuthService,
    private reservaService: ReservaService,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarPerfil();
    this.carregarReservas();
  }

  carregarPerfil() {
    this.isLoading = true;
    this.authService.obterPerfil().subscribe({
      next: (response) => {
        this.usuario = response;
        this.nome = response.nome;
        this.email = response.email;
        this.telefone = response.telefone || '';
        this.fotoPreview = this.processarUrlFoto(response.fotoPerfil || null);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar perfil:', error);
        this.showMessage('Erro ao carregar perfil', 'error');
        this.isLoading = false;
      }
    });
  }

  private processarUrlFoto(fotoPerfil: string | null): string | null {
    if (!fotoPerfil) return null;
    // Se já é uma URL completa, usar diretamente
    if (fotoPerfil.startsWith('http')) {
      return fotoPerfil;
    }
    // Se for só o nome do arquivo, monta a URL do backend
    return `http://localhost:8080/api/imagens/perfil/${fotoPerfil.replace(/^.*[\\\/]/, '')}`;
  }

  carregarReservas() {
    // Verificar se o usuário está logado antes de fazer a requisição
    if (!this.authService.isLogado()) {
      console.warn('Usuário não está logado - não carregando reservas');
      return;
    }

    console.log('Carregando reservas do usuário...');
    this.reservaService.obterReservasUsuario().subscribe({
      next: (reservas: ReservaUsuario[]) => {
        console.log('Reservas carregadas com sucesso:', reservas);
        this.reservas = reservas;
      },
      error: (error: any) => {
        console.error('Erro ao carregar reservas:', error);
        
        // Se for erro de autenticação, redirecionar para login
        if (error.status === 401) {
          console.log('Token inválido - redirecionando para login');
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validações
      if (!file.type.startsWith('image/')) {
        this.showMessage('Por favor, selecione apenas arquivos de imagem', 'error');
        return;
      }

      if (file.size > 20 * 1024 * 1024) { // 20MB
        this.showMessage('A imagem deve ter no máximo 20MB', 'error');
        return;
      }

      this.selectedFile = file;

      // Preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        this.fotoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadFoto() {
    if (!this.selectedFile) {
      this.showMessage('Selecione uma imagem primeiro', 'error');
      return;
    }

    this.isLoading = true;
    this.authService.uploadFotoPerfil(this.selectedFile).subscribe({
      next: (response) => {
        // Atualizar URL da foto no componente
        this.usuario.fotoPerfil = response.fotoUrl;
        this.fotoPreview = this.processarUrlFoto(response.fotoUrl);
        
        // Forçar recarregamento do perfil do AuthService
        this.authService.obterPerfil().subscribe({
          next: (perfilAtualizado) => {
            this.usuario = perfilAtualizado;
            this.fotoPreview = this.processarUrlFoto(perfilAtualizado.fotoPerfil || null);
          },
          error: (error) => {
            console.error('Erro ao recarregar perfil:', error);
          }
        });
        
        this.showMessage('Foto atualizada com sucesso!', 'success');
        this.selectedFile = null;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao fazer upload:', error);
        this.showMessage(error.error?.error || 'Erro ao fazer upload da foto', 'error');
        this.isLoading = false;
      }
    });
  }

  salvarPerfil() {
    // Validações
    if (!this.nome.trim()) {
      this.showMessage('Nome é obrigatório', 'error');
      return;
    }

    if (!this.email.trim()) {
      this.showMessage('Email é obrigatório', 'error');
      return;
    }

    if (this.senha && this.senha !== this.confirmarSenha) {
      this.showMessage('Senhas não coincidem', 'error');
      return;
    }

    this.isLoading = true;
    
    const dadosAtualizacao = {
      nome: this.nome,
      email: this.email,
      telefone: this.telefone,
      senha: this.senha || undefined
    };

    this.authService.atualizarPerfil(dadosAtualizacao).subscribe({
      next: (response) => {
        this.usuario = response;
        this.senha = '';
        this.confirmarSenha = '';
        this.showMessage('Perfil atualizado com sucesso!', 'success');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao atualizar perfil:', error);
        this.showMessage(error.error?.error || 'Erro ao atualizar perfil', 'error');
        this.isLoading = false;
      }
    });
  }

  removerFoto() {
    this.fotoPreview = null;
    this.selectedFile = null;
    // Aqui você poderia implementar a remoção da foto no servidor
  }

  showMessage(message: string, type: string) {
    this.message = message;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
      this.messageType = '';
    }, 5000);
  }

  voltar() {
    this.router.navigate(['/socio']);
  }
}
