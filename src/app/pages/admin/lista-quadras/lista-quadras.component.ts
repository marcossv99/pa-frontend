import { Component, OnInit } from '@angular/core';
import { QuadrasService, QuadraResponse } from '../../../services/quadras.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'app-lista-quadras',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-quadras.component.html',
  styleUrls: ['./lista-quadras.component.css']
})
export class ListaQuadrasComponent implements OnInit {
  quadras: QuadraResponse[] = [];
  loading = true;
  error = '';
  quadraSelecionada: QuadraResponse | null = null;

  constructor(private quadrasService: QuadrasService, private router: Router, private modalService: ModalService) {
    // Força recarga da lista ao navegar para esta rota
    this.router.events.subscribe(event => {
      // NavigationEnd garante que a navegação terminou
      if (event.constructor.name === 'NavigationEnd') {
        this.ngOnInit();
      }
    });
  }

  ngOnInit(): void {
    this.quadrasService.listar().subscribe({
      next: (data) => {
        // Ordenar por modalidade (alfabética) e depois por número
        this.quadras = data.sort((a, b) => {
          // Primeiro ordenar por modalidade (case insensitive)
          const modalidadeA = a.modalidade.toLowerCase();
          const modalidadeB = b.modalidade.toLowerCase();
          
          if (modalidadeA < modalidadeB) return -1;
          if (modalidadeA > modalidadeB) return 1;
          
          // Se modalidades forem iguais, ordenar por número
          return a.numero - b.numero;
        });
        this.loading = false;
      },
      error: () => {
        this.error = 'Erro ao carregar quadras';
        this.loading = false;
      }
    });
  }

  irParaCadastro() {
    this.router.navigate(['/admin/cadastro-quadra']);
  }

  voltarParaHome() {
    this.router.navigate(['/admin/home']);
  }

  irParaDetalhes(id: number) {
    this.router.navigate(['/admin/detalhe-quadra', id]);
  }

  abrirModalConfirmacao(quadra: QuadraResponse) {
    this.quadraSelecionada = quadra;
    // Usar Bootstrap para abrir o modal
    const modalElement = document.getElementById('modalConfirmacaoDisponibilidade');
    if (modalElement) {
      const bootstrap = (window as any).bootstrap;
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  confirmarAlteracaoDisponibilidade() {
    if (this.quadraSelecionada) {
      this.alterarDisponibilidade(this.quadraSelecionada);
    }
  }

  alterarDisponibilidade(quadra: QuadraResponse) {
    const novoStatus = !quadra.isDisponivel;
    const mensagem = novoStatus ? 'disponível' : 'indisponível';
    
    this.quadrasService.alterarDisponibilidade(quadra.id, novoStatus).subscribe({
      next: (quadraAtualizada) => {
        // Atualizar a quadra na lista local
        const index = this.quadras.findIndex(q => q.id === quadra.id);
        if (index !== -1) {
          this.quadras[index] = quadraAtualizada;
        }
        this.modalService.showSuccess(
          'Status Alterado',
          `Quadra ${quadra.numero} - ${quadra.modalidade} marcada como ${mensagem} com sucesso!`
        );
      },
      error: () => {
        this.modalService.showError(
          'Erro ao Alterar Status',
          'Erro ao alterar status da quadra. Tente novamente.'
        );
      }
    });
  }
}
