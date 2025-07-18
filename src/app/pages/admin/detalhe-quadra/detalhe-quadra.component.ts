import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuadrasService, QuadraResponse } from '../../../services/quadras.service';
import { ReservasService, ReservaResponse } from '../../../services/reservas.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-detalhe-quadra',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalhe-quadra.component.html',
  styleUrls: ['./detalhe-quadra.component.css']
})
export class DetalheQuadraComponent implements OnInit {
  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = '/home-socio/futebol-quadra.png';
    }
  }
  quadraTemReservaFutura = false;
  quadraTemReservas = false;
  reservasDaQuadra: ReservaResponse[] = [];
  quadra?: QuadraResponse;
  loading = true;
  error = '';
  showModalSucesso = false;
  showModalErro = false;
  showModalConfirmacao = false;
  mensagemModal = '';

  constructor(
    private route: ActivatedRoute,
    private quadrasService: QuadrasService,
    private reservasService: ReservasService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.quadrasService.buscarPorId(id).subscribe({
      next: (data) => {
        this.quadra = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Erro ao carregar detalhes da quadra';
        this.loading = false;
      }
    });
  }

  editarQuadra() {
    if (this.quadra) {
      this.router.navigate(['/admin/cadastro-quadra'], { queryParams: { id: this.quadra.id } });
    }
  }

  voltarParaLista() {
    this.router.navigate(['/admin/lista-quadras']);
  }

  getImagePath(imageName: string | undefined): string {
    // Se não há nome de imagem, retorna a imagem padrão
    if (!imageName) {
      return '/home-socio/futebol-quadra.png';
    }
    // Se já contém o path completo ou é URL, retorna como está
    if (imageName.includes('/') || imageName.includes('http')) {
      return imageName;
    }
    // Sempre buscar da pasta pública quadras
    return `/quadras/${imageName}`;
  }

  alterarDisponibilidade() {
    if (this.quadra) {
      const novoStatus = !this.quadra.isDisponivel;
      this.quadrasService.alterarDisponibilidade(this.quadra.id, novoStatus).subscribe({
        next: (quadraAtualizada) => {
          this.quadra = quadraAtualizada;
          this.mensagemModal = `Quadra ${novoStatus ? 'ativada' : 'desativada'} com sucesso!`;
          this.showModalSucesso = true;
        },
        error: () => {
          this.mensagemModal = 'Erro ao alterar disponibilidade da quadra!';
          this.showModalErro = true;
        }
      });
    }
  }

  deletarQuadra() {
    if (this.quadra) {
      // Usar endpoint específico para admin
      this.reservasService.listarTodasParaAdmin().subscribe(reservas => {
        this.reservasDaQuadra = reservas.filter(r => r.quadraId === this.quadra!.id);
        this.quadraTemReservas = this.reservasDaQuadra.length > 0;
        // Verifica se há reservas futuras
        const hoje = new Date();
        this.quadraTemReservaFutura = this.reservasDaQuadra.some(r => {
          const dataReserva = new Date(r.data);
          // Considera reserva futura se a data for hoje ou depois
          return dataReserva >= new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        });
        this.showModalConfirmacao = true;
      });
    }
  }

  confirmarDelecaoQuadra() {
    if (this.quadra) {
      this.quadrasService.deletar(this.quadra.id).subscribe({
        next: () => {
          this.mensagemModal = 'Quadra deletada com sucesso!';
          this.showModalSucesso = true;
          setTimeout(() => {
            this.router.navigate(['/admin/lista-quadras']);
          }, 1500);
        },
        error: (error) => {
          console.error('Erro ao deletar quadra:', error);
          if (error.status === 409 && error.error?.error) {
            this.mensagemModal = `Não é possível excluir a quadra pois existem reservas futuras não concluídas.\n\nSó é permitido excluir quadras sem reservas futuras.\n\nLibere ou exclua as reservas futuras antes de tentar excluir a quadra.`;
          } else if (error.status === 400 && error.error?.error) {
            this.mensagemModal = `Erro: ${error.error.error}`;
          } else if (error.status === 404) {
            this.mensagemModal = 'Erro: Quadra não encontrada ou backend não está disponível.';
          } else if (error.status === 0) {
            this.mensagemModal = 'Erro: Não foi possível conectar ao servidor. Verifique se o backend está rodando.';
          } else {
            this.mensagemModal = 'Erro inesperado ao deletar quadra. Tente novamente.';
          }
          this.showModalErro = true;
        }
      });
    }
  }

  fecharModalSucesso() {
    this.showModalSucesso = false;
    this.mensagemModal = '';
  }
  fecharModalErro() {
    this.showModalErro = false;
    this.mensagemModal = '';
  }
  fecharModalConfirmacao() {
    this.showModalConfirmacao = false;
  }
}
