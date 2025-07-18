import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReservasService, ReservaResponse, ReservaPaginationParams, ReservaFilter } from '../../../services/reservas.service';
import { AssociadoService, PaginationParams, AssociadoFilter } from '../../../services/associado.service';
import { QuadrasService, QuadraResponse } from '../../../services/quadras.service';
import { AuthService } from '../../../services/auth.service';
import { ModalService } from '../../../services/modal.service';
import { forkJoin } from 'rxjs';

interface ReservaAdmin {
  id: number;
  usuarioId?: number; // Adicionar ID do usuário
  usuarioNome?: string;
  usuarioFotoPerfil?: string; // Adicionar foto do usuário
  quadra: {
    id: number;
    numero: number;
    modalidade: string;
    nome?: string;
  };
  horario: {
    id: number;
    data: string;
    horaInicio: number;
    horaFim: number;
  };
  membros: string[];
  status?: string;
  dataCriacao?: string;
  
  // Campos para cancelamento
  cancelada?: boolean;
  motivoCancelamento?: string;
  canceladaPor?: string;
  dataCancelamento?: string;
}

interface UsuarioAdmin {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  isAdmin: boolean;
}

type FilterType = 'todos' | 'admin' | 'associado';

@Component({
  selector: 'app-home-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home-admin.component.html',
  styleUrl: './home-admin.component.css'
})
export class HomeAdminComponent implements OnInit {
  // Estatísticas Dashboard
  totalReservas = 0;
  totalUsuarios = 0;
  totalQuadras = 0;
  reservasHoje = 0;
  
  // Filtros e busca
  filtroUsuario = '';
  filtroTipoUsuario: FilterType = 'todos';
  filtroReserva = '';
  mostrarReservasCanceladas = false;
  mostrarApenasReservasFuturas = true;

  toggleMostrarCanceladas() {
    this.mostrarReservasCanceladas = !this.mostrarReservasCanceladas;
    this.reservasPaginacao.currentPage = 0;
    this.carregarReservas();
  }

  toggleApenasFuturas() {
    this.mostrarApenasReservasFuturas = !this.mostrarApenasReservasFuturas;
    this.alternarReservasFuturas();
  }
  
  // Dados
  reservas: ReservaAdmin[] = [];
  usuarios: UsuarioAdmin[] = [];
  quadras: QuadraResponse[] = [];
  
  // Estados de carregamento
  carregandoReservas = false;
  carregandoUsuarios = false;
  carregandoEstatisticas = false;
  carregandoTodosUsuarios = false;
  erroReservas = '';
  erroUsuarios = '';
  erroTodosUsuarios = '';
  
  // Seleções para modais
  reservaSelecionada: ReservaAdmin | null = null;
  reservaParaCancelar: ReservaAdmin | null = null;
  motivoCancelamento: string = '';
  usuarioParaExcluir: UsuarioAdmin | null = null;
  usuarioSelecionado: UsuarioAdmin | null = null;
  usuarioParaEditar: UsuarioAdmin | null = null;
  
  // Dados do formulário de edição
  formEditarUsuario = {
    nome: '',
    email: '',
    cpf: '',
    telefone: '',
    isAdmin: false
  };
  
  // Modal de todos os usuários
  todosUsuarios: UsuarioAdmin[] = [];
  usuariosFiltrados: UsuarioAdmin[] = [];
  filtroNomeUsuario = '';
  filtroEmailUsuario = '';
  
  // Paginação - Reservas
  reservasPaginacao = {
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 6
  };
  
  // Paginação - Usuários
  usuariosPaginacao = {
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10
  };

  // Paginação completa de usuários
  usuariosPaginacaoCompleta = {
    currentPage: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0
  };
  totalPaginasUsuarios = 0;

  constructor(
    private router: Router,
    private reservasService: ReservasService,
    private associadoService: AssociadoService,
    private quadrasService: QuadrasService,
    private authService: AuthService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.verificarPermissaoAdmin();
    this.carregarDadosIniciais();
    
    // Listener para mudanças no usuário logado
    this.authService.usuarioLogado$.subscribe(usuario => {
      if (!usuario || !usuario.isAdmin) {
        // Se o usuário não é mais admin, limpar todos os dados
        this.limparDadosAdmin();
      }
    });
  }

  // Limpar dados sensíveis quando não há autorização
  private limparDadosAdmin(): void {
    this.reservas = [];
    this.usuarios = [];
    this.quadras = [];
    this.todosUsuarios = [];
    this.usuariosFiltrados = [];
    this.totalReservas = 0;
    this.totalUsuarios = 0;
    this.totalQuadras = 0;
    this.reservasHoje = 0;
    this.reservaSelecionada = null;
    this.reservaParaCancelar = null;
    this.usuarioSelecionado = null;
    this.usuarioParaEditar = null;
  }

  // Verificar se o usuário tem permissão de admin
  private verificarPermissaoAdmin(): void {
    const usuarioLogado = this.authService.getUsuarioLogado();
    if (!usuarioLogado || !usuarioLogado.isAdmin) {
      console.error('Usuário sem permissão de administrador tentou acessar dados admin');
      
      // Limpar todos os dados sensíveis
      this.limparDadosAdmin();
      
      this.modalService.showError(
        'Acesso Negado',
        'Você não tem permissão para acessar esta funcionalidade.'
      );
      this.router.navigate(['/login']);
      return;
    }
  }

  // ========== MÉTODOS DE AUTENTICAÇÃO ==========

  fazerLogout(): void {
    this.modalService.showConfirm(
      'Confirmar Logout',
      'Tem certeza que deseja sair do sistema?<br><br><div class="text-muted"><i class="bi bi-info-circle me-2"></i>Você será redirecionado para a página de login.</div>',
      () => {
        this.authService.logout();
        // O AuthService já redireciona para /login automaticamente
      },
      () => {
        // Usuário cancelou o logout - não fazer nada
      }
    );
  }

  // ========== MÉTODOS PRINCIPAIS ========== 

  carregarDadosIniciais(): void {
    this.carregarEstatisticas();
    this.carregarReservas();
    this.carregarUsuarios();
  }

  carregarEstatisticas(): void {
    // Verificar se é admin antes de carregar estatísticas
    const usuarioLogado = this.authService.getUsuarioLogado();
    if (!usuarioLogado || !usuarioLogado.isAdmin) {
      console.error('Tentativa de acesso não autorizado às estatísticas');
      return;
    }

    this.carregandoEstatisticas = true;
    
    // Carregar dados em paralelo para estatísticas
    forkJoin({
      reservas: this.reservasService.listarTodasParaAdmin(),
      usuarios: this.associadoService.listar(),
      quadras: this.quadrasService.listar()
    }).subscribe({
      next: (data) => {
        this.totalReservas = data.reservas.length;
        this.totalUsuarios = data.usuarios.length;
        this.totalQuadras = data.quadras.length;
        this.quadras = data.quadras;
        
        // Calcular reservas de hoje
        const hoje = new Date().toISOString().split('T')[0];
        this.reservasHoje = data.reservas.filter(reserva => reserva.data === hoje).length;
        
        this.carregandoEstatisticas = false;
      },
      error: (erro) => {
        console.error('Erro ao carregar estatísticas:', erro);
        // Fallback para valores padrão em caso de erro
        this.totalReservas = 0;
        this.totalUsuarios = 0;
        this.totalQuadras = 0;
        this.reservasHoje = 0;
        this.carregandoEstatisticas = false;
      }
    });
  }

  recarregarDados(): void {
    this.carregarDadosIniciais();
  }

  // ========== NAVEGAÇÃO ==========

  irParaCadastroSocio(): void {
    this.router.navigate(['/cadastro/socio']);
  }

  irParaCadastroAdmin(): void {
    this.router.navigate(['/admin/cadastro-admin']);
  }

  irParaCadastroQuadra(): void {
    this.router.navigate(['/admin/cadastro-quadra']);
  }

  verTodasQuadras(): void {
    this.router.navigate(['/admin/lista-quadras']);
  }

  verTodosUsuarios(): void {
    this.carregarTodosUsuarios();
    const modalElement = document.getElementById('modalTodosUsuarios');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  // ========== RESERVAS ==========

  carregarReservas(): void {
    // Verificar novamente se é admin antes de carregar todas as reservas
    const usuarioLogado = this.authService.getUsuarioLogado();
    if (!usuarioLogado || !usuarioLogado.isAdmin) {
      console.error('Tentativa de acesso não autorizado aos dados de reservas');
      this.erroReservas = 'Acesso não autorizado';
      return;
    }

    this.carregandoReservas = true;
    this.erroReservas = '';
    
    const params: ReservaPaginationParams = {
      page: this.reservasPaginacao.currentPage,
      size: this.reservasPaginacao.pageSize,
      sort: 'data',
      direction: 'desc'
    };
    
    const filter: ReservaFilter = {};
    if (this.filtroReserva.trim()) {
      filter.usuarioNome = this.filtroReserva.trim();
    }
    
    this.reservasService.listarPaginadoParaAdmin(params, filter).subscribe({
      next: (response) => {
        let reservasFiltradas = this.mapearReservasParaAdmin(response.content);
        
        // Aplicar filtros de data e cancelamento
        reservasFiltradas = this.aplicarFiltrosReservas(reservasFiltradas);
        
        this.reservas = reservasFiltradas;
        this.reservasPaginacao.totalElements = reservasFiltradas.length;
        this.reservasPaginacao.totalPages = Math.ceil(reservasFiltradas.length / this.reservasPaginacao.pageSize);
        this.carregandoReservas = false;
      },
      error: (erro) => {
        console.error('Erro ao carregar reservas:', erro);
        this.erroReservas = 'Erro ao carregar reservas. Tente novamente.';
        this.carregandoReservas = false;
      }
    });
  }

  private aplicarFiltrosReservas(reservas: ReservaAdmin[]): ReservaAdmin[] {
    let reservasFiltradas: ReservaAdmin[];
    if (this.mostrarReservasCanceladas) {
      // Mostra apenas reservas canceladas (cancelada === true)
      reservasFiltradas = reservas.filter(reserva => reserva.cancelada === true);
    } else {
      // Mostra apenas reservas não canceladas (cancelada !== true)
      reservasFiltradas = reservas.filter(reserva => !reserva.cancelada);
    }

    // Filtro de reservas futuras
    if (this.mostrarApenasReservasFuturas) {
      const agora = new Date();
      reservasFiltradas = reservasFiltradas.filter(reserva => {
        const dataReserva = this.criarDataLocal(reserva.horario.data);
        const horaReserva = reserva.horario.horaInicio;
        // Criar data/hora completa da reserva
        const dataHoraReserva = new Date(dataReserva);
        dataHoraReserva.setHours(Math.floor(horaReserva), (horaReserva % 1) * 60);
        return dataHoraReserva > agora;
      });
    }
    return reservasFiltradas;
  }

  private mapearReservasParaAdmin(reservas: ReservaResponse[]): ReservaAdmin[] {
    return reservas.map(reserva => ({
      id: reserva.id,
      usuarioId: reserva.usuarioId, // Incluir ID do usuário
      usuarioNome: reserva.usuarioNome,
      usuarioFotoPerfil: reserva.usuarioFotoPerfil, // Incluir foto do usuário
      quadra: {
        id: reserva.quadraId,
        numero: this.obterNumeroQuadra(reserva.quadraId),
        modalidade: this.obterModalidadeQuadra(reserva.quadraId),
        nome: reserva.quadraNome
      },
      horario: {
        id: reserva.horarioId || 0,
        data: reserva.data,
        horaInicio: reserva.horaInicio,
        horaFim: reserva.horaFim
      },
      membros: reserva.membros || [],
      status: reserva.cancelada ? 'CANCELADA' : this.determinarStatusReserva(reserva),
      dataCriacao: new Date().toISOString(), // Placeholder - ajustar quando backend fornecer
      
      // Campos de cancelamento
      cancelada: reserva.cancelada,
      motivoCancelamento: reserva.motivoCancelamento,
      canceladaPor: reserva.canceladaPor,
      dataCancelamento: reserva.dataCancelamento
    }));
  }

  private obterNumeroQuadra(quadraId: number): number {
    const quadra = this.quadras.find(q => q.id === quadraId);
    return quadra?.numero || quadraId;
  }

  private obterModalidadeQuadra(quadraId: number): string {
    const quadra = this.quadras.find(q => q.id === quadraId);
    return quadra?.modalidade || 'Não informado';
  }

  private determinarStatusReserva(reserva: ReservaResponse): string {
    const hoje = new Date();
    const dataReserva = this.criarDataLocal(reserva.data);
    
    // Resetar horário para comparar apenas a data
    hoje.setHours(0, 0, 0, 0);
    dataReserva.setHours(0, 0, 0, 0);
    
    if (dataReserva < hoje) {
      return 'REALIZADA';
    } else if (dataReserva.getTime() === hoje.getTime()) {
      return 'HOJE';
    } else {
      return 'CONFIRMADA';
    }
  }

  // Método auxiliar para criar data local sem problemas de fuso horário
  private criarDataLocal(dataString: string): Date {
    const [ano, mes, dia] = dataString.split('-').map(Number);
    return new Date(ano, mes - 1, dia); // mes - 1 porque Date usa 0-indexado para meses
  }

  private filtrarReservas(reservas: ReservaAdmin[]): ReservaAdmin[] {
    if (!this.filtroReserva.trim()) {
      return reservas;
    }
    
    const filtro = this.filtroReserva.toLowerCase().trim();
    return reservas.filter(reserva => 
      reserva.usuarioNome?.toLowerCase().includes(filtro) ||
      reserva.quadra.nome?.toLowerCase().includes(filtro) ||
      reserva.quadra.modalidade.toLowerCase().includes(filtro)
    );
  }

  private aplicarPaginacaoReservas(): void {
    this.reservasPaginacao.totalElements = this.reservas.length;
    this.reservasPaginacao.totalPages = Math.ceil(this.reservas.length / this.reservasPaginacao.pageSize);
  }

  get reservasPaginadas(): ReservaAdmin[] {
    const inicio = this.reservasPaginacao.currentPage * this.reservasPaginacao.pageSize;
    const fim = inicio + this.reservasPaginacao.pageSize;
    return this.reservas.slice(inicio, fim);
  }

  recarregarReservas(): void {
    this.carregarReservas();
  }

  onFiltroReservaInput(event: any): void {
    this.filtroReserva = event.target.value;
    this.reservasPaginacao.currentPage = 0;
    this.carregarReservas();
  }

  alternarReservasCanceladas(): void {
    this.mostrarReservasCanceladas = !this.mostrarReservasCanceladas;
    this.reservasPaginacao.currentPage = 0;
    this.carregarReservas();
  }

  alternarReservasFuturas(): void {
    this.mostrarApenasReservasFuturas = !this.mostrarApenasReservasFuturas;
    this.reservasPaginacao.currentPage = 0;
    this.carregarReservas();
  }

  limparFiltrosReservas(): void {
    this.filtroReserva = '';
    this.mostrarReservasCanceladas = false;
    this.mostrarApenasReservasFuturas = true;
    this.reservasPaginacao.currentPage = 0;
    this.carregarReservas();
  }

  verDetalhesReserva(reserva: ReservaAdmin): void {
    this.reservaSelecionada = reserva;
    // Abrir modal usando Bootstrap
    const modal = document.getElementById('modalDetalhesReserva');
    if (modal) {
      const bootstrapModal = new (window as any).bootstrap.Modal(modal);
      bootstrapModal.show();
    }
  }

  // Método removido - funcionalidade de edição desabilitada para administradores
  // editarReserva(reserva: ReservaAdmin): void {
  //   console.log('Editando reserva:', reserva);
  //   // Implementar navegação para edição de reserva
  //   // this.router.navigate(['/admin/editar-reserva', reserva.id]);
  // }

  // ========== CANCELAMENTO DE RESERVA (ADMIN) ==========

  abrirModalConfirmacaoCancelamento(reserva: ReservaAdmin): void {
    this.reservaParaCancelar = reserva;
    this.motivoCancelamento = ''; // Limpar o motivo anterior
    
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      const modalElement = document.getElementById('modalConfirmacaoCancelamento');
      if (modalElement) {
        const modal = new (window as any).bootstrap.Modal(modalElement);
        modal.show();
      }
    }
  }

  confirmarCancelamentoReserva(): void {
    if (!this.reservaParaCancelar) return;
    
    // Validar se o motivo foi preenchido
    if (!this.motivoCancelamento || this.motivoCancelamento.trim().length === 0) {
      this.modalService.showWarning(
        'Campo Obrigatório',
        'Por favor, informe o motivo do cancelamento.'
      );
      return;
    }

    this.reservasService.cancelarPorAdmin(this.reservaParaCancelar.id, this.motivoCancelamento.trim()).subscribe({
      next: () => {
        // Atualizar a reserva na lista local como cancelada
        const index = this.reservas.findIndex(r => r.id === this.reservaParaCancelar!.id);
        if (index > -1) {
          this.reservas[index].status = 'CANCELADA';
          this.reservas[index].cancelada = true;
          this.reservas[index].motivoCancelamento = this.motivoCancelamento.trim();
          this.reservas[index].canceladaPor = 'ADMIN';
          this.reservas[index].dataCancelamento = new Date().toISOString();
        }
        
        // Recarregar a lista de reservas para garantir consistência
        this.carregarReservas();
        
        // Atualizar estatísticas
        this.carregarEstatisticas();
        
        // Fechar modal
        this.fecharModalConfirmacaoCancelamento();
        
        // Mostrar mensagem de sucesso
        this.modalService.showSuccess(
          'Reserva Cancelada',
          `Reserva cancelada com sucesso!<br><br><strong>Motivo:</strong> ${this.motivoCancelamento}<br><br>O associado será notificado sobre o cancelamento.`
        );
      },
      error: (error: any) => {
        console.error('Erro ao cancelar reserva:', error);
        this.modalService.showError(
          'Erro ao Cancelar',
          'Erro ao cancelar reserva. Tente novamente.'
        );
      }
    });
  }

  fecharModalConfirmacaoCancelamento(): void {
    this.reservaParaCancelar = null;
    this.motivoCancelamento = ''; // Limpar o motivo
    
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      const modalElement = document.getElementById('modalConfirmacaoCancelamento');
      if (modalElement) {
        const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      }
    }
  }

  // ========== USUÁRIOS ==========

  carregarUsuarios(): void {
    this.carregandoUsuarios = true;
    this.erroUsuarios = '';
    
    const params: PaginationParams = {
      page: this.usuariosPaginacao.currentPage,
      size: this.usuariosPaginacao.pageSize,
      sort: 'nome',
      direction: 'asc'
    };
    
    const filter: AssociadoFilter = {};
    if (this.filtroUsuario.trim()) {
      filter.nome = this.filtroUsuario.trim();
    }
    if (this.filtroTipoUsuario !== 'todos') {
      filter.isAdmin = this.filtroTipoUsuario === 'admin';
    }
    
    this.associadoService.listarPaginado(params, filter).subscribe({
      next: (response) => {
        this.usuarios = response.content.map(usuario => ({
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          cpf: usuario.cpf,
          telefone: usuario.telefone,
          isAdmin: usuario.isAdmin === true
        }));
        this.usuariosPaginacao.totalElements = response.totalElements;
        this.usuariosPaginacao.totalPages = response.totalPages;
        this.carregandoUsuarios = false;
      },
      error: (erro) => {
        console.error('Erro ao carregar usuários:', erro);
        this.erroUsuarios = 'Erro ao carregar usuários. Tente novamente.';
        this.carregandoUsuarios = false;
        
        // Fallback para dados mockados se houver erro na API
        // this.carregarUsuariosMockados();
      }
    });
  }

  // ========== MODAL TODOS OS USUÁRIOS ==========

  carregarTodosUsuarios(): void {
    this.carregandoTodosUsuarios = true;
    this.erroTodosUsuarios = '';
    
    const params = {
      page: this.usuariosPaginacaoCompleta.currentPage,
      size: this.usuariosPaginacaoCompleta.pageSize,
      sort: 'nome',
      direction: 'asc' as const
    };

    this.associadoService.listarPaginado(params).subscribe({
      next: (response: any) => {
        this.todosUsuarios = response.content;
        this.usuariosPaginacaoCompleta.totalElements = response.totalElements;
        this.usuariosPaginacaoCompleta.totalPages = response.totalPages;
        this.totalPaginasUsuarios = response.totalPages;
        this.aplicarFiltroUsuarios();
        this.carregandoTodosUsuarios = false;
      },
      error: (error: any) => {
        console.error('Erro ao carregar todos os usuários:', error);
        this.erroTodosUsuarios = 'Erro ao carregar usuários. Tente novamente.';
        this.carregandoTodosUsuarios = false;
      }
    });
  }

  aplicarFiltroUsuarios(): void {
    let usuariosFiltrados = [...this.todosUsuarios];

    // Filtro por tipo
    if (this.filtroTipoUsuario === 'admin') {
      usuariosFiltrados = usuariosFiltrados.filter(u => u.isAdmin);
    } else if (this.filtroTipoUsuario === 'associado') {
      usuariosFiltrados = usuariosFiltrados.filter(u => !u.isAdmin);
    }

    // Filtro por nome
    if (this.filtroNomeUsuario.trim()) {
      const nomeFilter = this.filtroNomeUsuario.toLowerCase().trim();
      usuariosFiltrados = usuariosFiltrados.filter(u => 
        u.nome.toLowerCase().includes(nomeFilter)
      );
    }

    // Filtro por email
    if (this.filtroEmailUsuario.trim()) {
      const emailFilter = this.filtroEmailUsuario.toLowerCase().trim();
      usuariosFiltrados = usuariosFiltrados.filter(u => 
        u.email.toLowerCase().includes(emailFilter)
      );
    }

    this.usuariosFiltrados = usuariosFiltrados;
  }

  irParaPaginaUsuarios(page: number): void {
    if (page >= 0 && page < this.totalPaginasUsuarios) {
      this.usuariosPaginacaoCompleta.currentPage = page;
      this.carregarTodosUsuarios();
    }
  }

  visualizarDetalhesUsuario(usuario: UsuarioAdmin): void {
    this.usuarioSelecionado = usuario;
    this.modalService.showInfo(
      'Detalhes do Usuário',
      `<div class="mb-3">
        <strong>ID:</strong> ${usuario.id}<br>
        <strong>Nome:</strong> ${usuario.nome}<br>
        <strong>Email:</strong> ${usuario.email}<br>
        <strong>CPF:</strong> ${usuario.cpf}<br>
        <strong>Telefone:</strong> ${usuario.telefone || 'Não informado'}<br>
        <strong>Tipo:</strong> ${usuario.isAdmin ? 'Administrador' : 'Associado'}
      </div>`
    );
  }

  editarUsuario(usuario: UsuarioAdmin): void {
    this.usuarioParaEditar = { ...usuario };
    this.formEditarUsuario = {
      nome: usuario.nome,
      email: usuario.email,
      cpf: usuario.cpf,
      telefone: usuario.telefone || '',
      isAdmin: usuario.isAdmin
    };
    
    const modalElement = document.getElementById('modalEditarUsuario');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  // ========== MÉTODOS AUXILIARES ==========

  obterNomeQuadra(reserva: ReservaAdmin): string {
    return reserva.quadra.nome || `Quadra ${reserva.quadra.numero} - ${reserva.quadra.modalidade}`;
  }

  obterStatusClass(status: string): string {
    switch (status.toUpperCase()) {
      case 'CONFIRMADA':
        return 'bg-success';
      case 'CANCELADA':
        return 'bg-danger';
      case 'PENDENTE':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  }

  obterStatusTexto(status: string): string {
    switch (status.toUpperCase()) {
      case 'CONFIRMADA':
        return 'Confirmada';
      case 'CANCELADA':
        return 'Cancelada';
      case 'PENDENTE':
        return 'Pendente';
      default:
        return 'Desconhecido';
    }
  }

  formatarDataCriacao(reserva: ReservaAdmin): string {
    if (!reserva.dataCriacao) return 'Data não disponível';
    const data = new Date(reserva.dataCriacao);
    return data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  formatarDataCancelamento(reserva: ReservaAdmin): string {
    if (!reserva.dataCancelamento) return 'Data não disponível';
    const data = new Date(reserva.dataCancelamento);
    return data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  formatarHora(hora: number): string {
    return `${hora.toString().padStart(2, '0')}:00`;
  }

  obterFotoUsuario(reserva: ReservaAdmin): string {
    if (reserva.usuarioFotoPerfil && reserva.usuarioFotoPerfil.trim() !== '') {
      // Se a foto já é uma URL completa (começa com http), usar diretamente
      if (reserva.usuarioFotoPerfil.startsWith('http')) {
        return reserva.usuarioFotoPerfil;
      }
      // Se já vem com o caminho correto do backend
      if (reserva.usuarioFotoPerfil.startsWith('/api/imagens/perfil/')) {
        return reserva.usuarioFotoPerfil;
      }
      // Se é apenas o nome do arquivo, construir a URL do backend
      if (!reserva.usuarioFotoPerfil.startsWith('/')) {
        return `/api/imagens/perfil/${reserva.usuarioFotoPerfil}`;
      }
      // Fallback para outros casos
      return reserva.usuarioFotoPerfil;
    }
    return '';
  }

  temFotoUsuario(reserva: ReservaAdmin): boolean {
    return !!(reserva.usuarioFotoPerfil && reserva.usuarioFotoPerfil.trim() !== '');
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.style.display = 'none';
      const fallback = target.nextElementSibling as HTMLElement;
      if (fallback) {
        fallback.style.display = 'flex';
      }
    }
  }

  recarregarUsuarios(): void {
    this.carregarUsuarios();
  }

  get usuariosPaginados(): UsuarioAdmin[] {
    return this.usuarios;
  }

  excluirUsuario(usuario: UsuarioAdmin): void {
    this.abrirModalExclusaoUsuario(usuario);
  }

  confirmarExclusaoUsuario(): void {
    if (!this.usuarioParaExcluir) return;

    this.associadoService.deletar(this.usuarioParaExcluir.id).subscribe({
      next: () => {
        // Remover da lista local
        const index = this.usuarios.findIndex(u => u.id === this.usuarioParaExcluir!.id);
        if (index > -1) {
          this.usuarios.splice(index, 1);
        }

        // Remover da lista completa também
        const indexCompleto = this.todosUsuarios.findIndex(u => u.id === this.usuarioParaExcluir!.id);
        if (indexCompleto > -1) {
          this.todosUsuarios.splice(indexCompleto, 1);
        }

        // Aplicar filtros novamente
        this.aplicarFiltroUsuarios();

        // Recarregar estatísticas
        this.carregarEstatisticas();

        this.modalService.showSuccess('Exclusão realizada', 'Usuário excluído com sucesso!');
        this.usuarioParaExcluir = null;
      },
      error: (error: any) => {
        console.error('Erro ao excluir usuário:', error);
        this.modalService.showError('Erro na exclusão', 'Erro ao excluir usuário. Tente novamente.');
        this.usuarioParaExcluir = null;
      }
    });
  }

  abrirModalExclusaoUsuario(usuario: UsuarioAdmin): void {
    this.modalService.showConfirm(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o usuário <strong>${usuario.nome}</strong>?<br><br>
       <div class="alert alert-warning">
         <i class="bi bi-exclamation-triangle me-2"></i>
         <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todas as reservas associadas a este usuário serão mantidas.
       </div>`,
      () => {
        this.usuarioParaExcluir = usuario;
        this.confirmarExclusaoUsuario();
      },
      () => {
        this.usuarioParaExcluir = null;
      }
    );
  }

  salvarEdicaoUsuario(): void {
    if (!this.usuarioParaEditar) return;

    const dadosAtualizados = {
      id: this.usuarioParaEditar.id,
      nome: this.formEditarUsuario.nome,
      email: this.formEditarUsuario.email,
      cpf: this.formEditarUsuario.cpf,
      telefone: this.formEditarUsuario.telefone,
      isAdmin: this.formEditarUsuario.isAdmin
    };

    this.associadoService.editar(this.usuarioParaEditar.id, dadosAtualizados).subscribe({
      next: (usuarioAtualizado: any) => {
        // Atualizar na lista local
        const index = this.usuarios.findIndex(u => u.id === this.usuarioParaEditar!.id);
        if (index > -1) {
          this.usuarios[index] = { ...this.usuarios[index], ...dadosAtualizados };
        }

        // Atualizar na lista completa
        const indexCompleto = this.todosUsuarios.findIndex(u => u.id === this.usuarioParaEditar!.id);
        if (indexCompleto > -1) {
          this.todosUsuarios[indexCompleto] = { ...this.todosUsuarios[indexCompleto], ...dadosAtualizados };
        }

        // Aplicar filtros novamente
        this.aplicarFiltroUsuarios();

        // Fechar modal
        const modalElement = document.getElementById('modalEditarUsuario');
        if (modalElement) {
          const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            modal.hide();
          }
        }

        this.modalService.showSuccess('Usuário atualizado', 'Usuário atualizado com sucesso!');
        this.usuarioParaEditar = null;
      },
      error: (error: any) => {
        console.error('Erro ao atualizar usuário:', error);
        this.modalService.showError('Erro na atualização', 'Erro ao atualizar usuário. Tente novamente.');
      }
    });
  }

  // ========== MÉTODOS AUXILIARES ==========

  obterNomeUsuario(reserva: ReservaAdmin): string {
    return reserva.usuarioNome || 'Usuário não identificado';
  }

  formatarData(reserva: ReservaAdmin): string {
    const data = this.criarDataLocal(reserva.horario.data);
    return data.toLocaleDateString('pt-BR');
  }

  formatarHorario(reserva: ReservaAdmin): string {
    const inicio = this.formatarHora(reserva.horario.horaInicio);
    const fim = this.formatarHora(reserva.horario.horaFim);
    return `${inicio} - ${fim}`;
  }

  isReservaPassada(reserva: ReservaAdmin): boolean {
    const agora = new Date();
    const dataReserva = this.criarDataLocal(reserva.horario.data);
    const horaReserva = reserva.horario.horaInicio;
    
    // Criar data/hora completa da reserva
    const dataHoraReserva = new Date(dataReserva);
    dataHoraReserva.setHours(Math.floor(horaReserva), (horaReserva % 1) * 60);
    
    return dataHoraReserva <= agora;
  }

  podeSerCancelada(reserva: ReservaAdmin): boolean {
    return !reserva.cancelada && !this.isReservaPassada(reserva);
  }
}
