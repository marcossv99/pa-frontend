import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { QuadrasService, QuadraResponse } from '../../../services/quadras.service';

@Component({
  selector: 'app-quadras-socio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quadras-socio.component.html',
  styleUrl: './quadras-socio.component.css'
})
export class QuadrasSocioComponent implements OnInit {
  quadras: QuadraResponse[] = [];
  quadrasFiltradas: QuadraResponse[] = [];
  carregando = true;
  filtroModalidade = '';
  modalidades: string[] = [];

  constructor(
    private router: Router,
    private quadrasService: QuadrasService
  ) {}

  ngOnInit() {
    this.carregarQuadras();
  }

  navegarParaPerfil() {
    this.router.navigate(['/socio/perfil']);
  }

  abrirModalTodasReservas() {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }
    const modalElement = document.getElementById('modalTodasReservas');
    if (modalElement) {
      const existingModal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (existingModal) {
        existingModal.dispose();
      }
      const modal = new (window as any).bootstrap.Modal(modalElement, {
        backdrop: true,
        keyboard: true,
        focus: true
      });
      modal.show();
    }
  }

  carregarQuadras() {
    this.carregando = true;
    this.quadrasService.listar().subscribe({
      next: (quadras: QuadraResponse[]) => {
        this.quadras = quadras;
        this.quadrasFiltradas = quadras;
        this.extrairModalidades();
        this.carregando = false;
      },
      error: (error: any) => {
        console.error('Erro ao carregar quadras:', error);
        this.carregando = false;
        this.quadras = [];
        this.quadrasFiltradas = [];
        this.modalidades = [];
      }
    });
  }

  extrairModalidades() {
    const modalidadesUnicas = [...new Set(this.quadras.map(q => q.modalidade))];
    this.modalidades = modalidadesUnicas.sort();
  }

  getImageUrl(imageName: string | undefined): string {
    if (!imageName) {
      return '/home-socio/futebol-quadra.png';
    }
    if (imageName.includes('/') || imageName.includes('http')) {
      return imageName;
    }
    return `/quadras/${imageName}`;
  }

  filtrarPorModalidade(modalidade: string) {
    this.filtroModalidade = modalidade;
    if (modalidade === '') {
      this.quadrasFiltradas = this.quadras;
    } else {
      this.quadrasFiltradas = this.quadras.filter(q => q.modalidade === modalidade);
    }
  }

  verHorarios(quadraId: number) {
    this.router.navigate(['/socio/visualizar-quadra', quadraId]);
  }

  voltarHome() {
    this.router.navigate(['/socio/home']);
  }

  getStatusBadgeClass(quadra: QuadraResponse): string {
    return quadra.isDisponivel ? 'bg-success' : 'bg-secondary';
  }

  getStatusText(quadra: QuadraResponse): string {
    return quadra.isDisponivel ? 'Disponível' : 'Indisponível';
  }
}
