import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QuadrasService, HorarioDisponivel } from '../../../services/quadras.service';
import { ReservasService, ReservaResponse, ReservaUpdateRequest } from '../../../services/reservas.service';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'app-home-socio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home-socio.component.html',
  styleUrl: './home-socio.component.css'
})
export class HomeSocioComponent implements OnInit, OnDestroy {
  // Verifica se a reserva é passada (data e hora já ocorreram)
  public isReservaPassada(reserva: any): boolean {
    if (!reserva) return false;
    const agora = new Date();
    // Considera a horaFim para definir se já passou
    if (reserva.data && reserva.horaFim !== undefined) {
      const dataHoraFim = this.criarDataHoraLocal(reserva.data, reserva.horaFim);
      return dataHoraFim < agora;
    }
    return false;
  }

  // Mensagem do filtro aplicado no modal de todas as reservas
  public getFiltroMensagem(): string {
    if (this.filtroStatus === 'cancelada') {
      return 'Exibindo apenas reservas canceladas (pelo associado ou admin).';
    }
    if (this.filtroStatus === 'ativas') {
      return 'Exibindo apenas reservas ativas (não canceladas).';
    }
    if (this.filtroPeriodo === 'futuras') {
      return 'Exibindo apenas reservas futuras.';
    }
    if (this.filtroPeriodo === 'passadas') {
      return 'Exibindo apenas reservas passadas.';
    }
    if (this.filtroPeriodo === 'hoje') {
      return 'Exibindo apenas reservas de hoje.';
    }
    return 'Exibindo todas as reservas.';
  }
  constructor(
    private router: Router,
    private quadrasService: QuadrasService,
    private reservasService: ReservasService,
    private modalService: ModalService,
    private authService: AuthService
  ) {}
  
  fazerLogout(): void {
    this.modalService.showConfirm(
      'Confirmar Logout',
      'Tem certeza que deseja sair do sistema?<br><br><div class="text-muted"><i class="bi bi-info-circle me-2"></i>Você será redirecionado para a página de login.</div>',
      () => {
        this.authService.logout();
      },
      () => {
        // Usuário cancelou o logout - não fazer nada
      }
    );
  }
  
  // Propriedades do calendário
  currentDate = new Date();
  viewDate = new Date();
  calendarDays: any[] = [];
  monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Quadra em destaque
  quadrasCarrossel: any[] = [];
  carrosselIndex: number = 0;
  get quadraDestaque(): any {
    return this.quadrasCarrossel[this.carrosselIndex] || null;
  }

  // Reservas do sistema (todas as reservas para teste)
  minhasReservas: ReservaResponse[] = [];
  reservaSelecionada: ReservaResponse | null = null;

  // Modal de edição
  modalEdicaoAberto = false;
  reservaParaEdicao: ReservaResponse | null = null;
  horariosDisponiveis: HorarioDisponivel[] = [];
  horarioSelecionado: HorarioDisponivel | null = null;
  carregandoHorarios = false;
  novaDataReserva: string = '';
  
  // Gerenciamento de convidados na edição
  convidadosEdicao: string[] = [];
  nomeConvidadoEdicaoTemp: string = '';
  editandoConvidadoEdicaoIndex: number = -1;

  // Modal de todas as reservas
  showModalTodasReservas = false;
  todasReservas: ReservaResponse[] = [];
  todasReservasFiltradas: ReservaResponse[] = [];
  filtroStatus = '';
  filtroPeriodo = '';

  // Cancelamento de reserva
  reservaParaCancelar: ReservaResponse | null = null;

  // Upload de imagem de perfil
  usuarioLogado: any = {};
  fotoPerfilPreview: string | null = null;
  selectedFileProfile: File | null = null;
  isUploadingPhoto = false;

  ngOnInit() {
    this.generateCalendar();
    this.carregarQuadraDestaque();
    this.carregarMinhasReservas();
    this.carregarPerfilUsuario();
  }

  ngOnDestroy() {
    // Limpar modais ao destruir o componente
    this.limparModaisTravados();
  }

  carregarQuadraDestaque() {
    // Busca todas as quadras e monta o carrossel
    this.quadrasService.listar().subscribe({
      next: (quadras: any[]) => {
        if (quadras && quadras.length > 0) {
          // Garante no mínimo 5 quadras (repete se necessário)
          let lista = [...quadras];
          while (lista.length < 5) {
            lista = lista.concat(quadras);
          }
          this.quadrasCarrossel = lista.slice(0, 5);
          this.carrosselIndex = 0;
        }
      },
      error: (error: any) => {
        // Fallback para mock se não conseguir carregar do backend
        this.quadrasCarrossel = [
          { id: 1, numero: 1, modalidade: 'Futebol', qtdPessoas: 22, img: undefined },
          { id: 2, numero: 2, modalidade: 'Vôlei', qtdPessoas: 12, img: undefined },
          { id: 3, numero: 3, modalidade: 'Basquete', qtdPessoas: 10, img: undefined },
          { id: 4, numero: 4, modalidade: 'Tênis', qtdPessoas: 4, img: undefined },
          { id: 5, numero: 5, modalidade: 'Futsal', qtdPessoas: 10, img: undefined }
        ];
        this.carrosselIndex = 0;
      }
    });
  }

  proximaQuadra() {
    if (this.quadrasCarrossel.length > 0) {
      this.carrosselIndex = (this.carrosselIndex + 1) % this.quadrasCarrossel.length;
    }
  }

  anteriorQuadra() {
    if (this.quadrasCarrossel.length > 0) {
      this.carrosselIndex = (this.carrosselIndex - 1 + this.quadrasCarrossel.length) % this.quadrasCarrossel.length;
    }
  }

  carregarMinhasReservas() {
    // Obter o usuário logado
    const usuarioLogado = this.authService.getUsuarioLogado();
    if (!usuarioLogado) {
      console.error('Usuário não logado tentou carregar reservas');
      this.minhasReservas = [];
      this.generateCalendar();
      return;
    }

    // Listar apenas reservas futuras e não canceladas do usuário logado
    this.reservasService.listarPorUsuario(usuarioLogado.userId).subscribe({
      next: (reservas: ReservaResponse[]) => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        this.minhasReservas = reservas
          .map(reserva => ({
            ...reserva,
            data: this.formatarDataParaString(reserva.data),
            status: reserva.status || 'confirmada'
          }))
          .filter(reserva => {
            const dataReserva = this.criarDataLocal(reserva.data);
            dataReserva.setHours(0, 0, 0, 0);
            // Filtrar apenas reservas futuras E não canceladas
            return dataReserva >= hoje && !reserva.cancelada;
          });
        this.generateCalendar();
      },
      error: (error: any) => {
        console.error('Erro ao carregar reservas do usuário:', error);
        this.minhasReservas = [];
        this.generateCalendar();
      }
    });
  }

  formatarDataParaString(data: any): string {
    if (typeof data === 'string') {
      return data;
    }
    if (data instanceof Date) {
      return this.formatDate(data);
    }
    if (data && typeof data === 'object' && data.year && data.month && data.day) {
      // LocalDate do Java vem como {year: 2025, month: 7, day: 3}
      const month = String(data.month).padStart(2, '0');
      const day = String(data.day).padStart(2, '0');
      return `${data.year}-${month}-${day}`;
    }
    return String(data);
  }

  // Gera o calendário do mês atual
  generateCalendar() {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    
    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    // Último dia do mês
    const lastDay = new Date(year, month + 1, 0);
    
    // Dia da semana do primeiro dia (0 = domingo)
    const startDay = firstDay.getDay();
    
    this.calendarDays = [];
    
    // Adiciona dias vazios do mês anterior
    for (let i = 0; i < startDay; i++) {
      this.calendarDays.push({
        day: null,
        isCurrentMonth: false,
        isToday: false,
        hasReservation: false
      });
    }
    
    // Adiciona todos os dias do mês
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const currentDayDate = new Date(year, month, day);
      const dateString = this.formatDate(currentDayDate);
      
      this.calendarDays.push({
        day: day,
        date: currentDayDate,
        dateString: dateString,
        isCurrentMonth: true,
        isToday: this.isToday(currentDayDate),
        hasReservation: this.hasReservationOnDate(dateString)
      });
    }
  }

  // Verifica se uma data é hoje
  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  // Verifica se há reserva em uma data específica
  hasReservationOnDate(dateString: string): boolean {
    return this.minhasReservas.some(reserva => reserva.data === dateString);
  }

  // Formata data para string (YYYY-MM-DD)
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Navega para o mês anterior
  previousMonth() {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  // Navega para o próximo mês
  nextMonth() {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  // Obtém o nome do mês atual
  getCurrentMonthName(): string {
    return this.monthNames[this.viewDate.getMonth()];
  }

  // Obtém o ano atual
  getCurrentYear(): number {
    return this.viewDate.getFullYear();
  }

  // Clique em um dia do calendário
  onDayClick(dayData: any) {
    if (dayData.hasReservation && dayData.dateString) {
      // Encontra as reservas do dia clicado
      const reservasNoDia = this.minhasReservas.filter(reserva => reserva.data === dayData.dateString);
      
      if (reservasNoDia.length > 0) {
        // Pega a primeira reserva para mostrar no modal
        this.reservaSelecionada = reservasNoDia[0];
        this.abrirModalReserva();
      }
    }
  }

  reservarQuadra(quadraId: number) {
    console.log('Reservar quadra:', quadraId);
    // Aqui você implementaria a lógica de reserva
  }

  verDetalhesQuadra(quadraId: number) {
    console.log('Ver detalhes da quadra:', quadraId);
    // Aqui você implementaria a navegação para detalhes
  }

  verHorariosDisponiveis() {
    // Navega para a página de visualização da quadra usando o ID real da quadra em destaque
    const quadraId = this.quadraDestaque?.id || 1;
    this.router.navigate(['/socio/visualizar-quadra', quadraId]);
  }

  navegarParaQuadras() {
    this.router.navigate(['/socio/quadras']);
  }
  
  navegarParaPerfil() {
    this.router.navigate(['/socio/perfil']);
  }

  abrirModalReserva() {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }
    
    const modalElement = document.getElementById('modalReservaDetalhes');
    if (modalElement) {
      // Garantir que não há instância anterior
      const existingModal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (existingModal) {
        existingModal.dispose();
      }
      
      // Criar nova instância do modal
      const modal = new (window as any).bootstrap.Modal(modalElement, {
        backdrop: true,
        keyboard: true,
        focus: true
      });
      modal.show();
    }
  }

  formatarHorario(horaInicio: number, horaFim: number): string {
    const formatHora = (hora: number) => {
      const horas = Math.floor(hora);
      const minutos = (hora - horas) * 60;
      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
    };
    
    return `${formatHora(horaInicio)} - ${formatHora(horaFim)}`;
  }


  editarReserva(reservaId: number) {
    const reserva = this.minhasReservas.find(r => r.id === reservaId);
    if (reserva) {
      this.reservaParaEdicao = { ...reserva };
      this.novaDataReserva = reserva.data;
      
      // Inicializar lista de convidados para edição
      this.convidadosEdicao = reserva.membros ? [...reserva.membros] : [];
      this.nomeConvidadoEdicaoTemp = '';
      this.editandoConvidadoEdicaoIndex = -1;
      
      this.carregarHorariosParaEdicao();
      this.abrirModalEdicao();
    }
  }

  // Método para editar reserva a partir do modal de todas as reservas
  editarReservaDoModal(reservaId: number) {
    // Fechar o modal de todas as reservas primeiro
    this.fecharModalTodasReservas();
    
    // Aguardar um pouco para que o modal feche completamente
    setTimeout(() => {
      this.editarReserva(reservaId);
    }, 300);
  }

  // Método para cancelar reserva a partir do modal de todas as reservas

  // Método para lidar com mudança de data
  onDataChange() {
    if (this.reservaParaEdicao && this.novaDataReserva) {
      this.carregarHorariosParaEdicao();
    }
  }

  // Método para obter data mínima (hoje)
  getDataMinima(): string {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  }

  private carregarHorariosParaEdicao() {
    if (!this.reservaParaEdicao) return;
    
    // Usar a nova data se foi selecionada, senão usar a data original
    const dataParaConsulta = this.novaDataReserva || this.reservaParaEdicao.data;
    
    this.carregandoHorarios = true;
    this.quadrasService.listarHorariosDisponiveis(this.reservaParaEdicao.quadraId, dataParaConsulta)
      .subscribe({
        next: (horarios) => {
          this.horariosDisponiveis = horarios;
          // Pré-selecionar o horário atual da reserva apenas se a data não mudou
          if (dataParaConsulta === this.reservaParaEdicao!.data) {
            this.horarioSelecionado = horarios.find(h => 
              h.horaInicio === this.reservaParaEdicao!.horaInicio && 
              h.horaFim === this.reservaParaEdicao!.horaFim
            ) || null;
          } else {
            this.horarioSelecionado = null;
          }
          this.carregandoHorarios = false;
        },
        error: (error) => {
          console.error('Erro ao carregar horários:', error);
          this.carregandoHorarios = false;
          this.modalService.showError(
            'Erro ao Carregar',
            'Erro ao carregar horários disponíveis'
          );
        }
      });
  }

  private abrirModalEdicao() {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }
    
    this.modalEdicaoAberto = true;
    const modalElement = document.getElementById('modalEdicaoReserva');
    if (modalElement) {
      // Garantir que não há instância anterior
      const existingModal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (existingModal) {
        existingModal.dispose();
      }
      
      // Criar nova instância do modal
      const modal = new (window as any).bootstrap.Modal(modalElement, {
        backdrop: true,
        keyboard: true,
        focus: true
      });
      modal.show();
    }
  }

  fecharModalEdicao() {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }
    
    this.modalEdicaoAberto = false;
    this.reservaParaEdicao = null;
    this.horariosDisponiveis = [];
    this.horarioSelecionado = null;
    
    const modalElement = document.getElementById('modalEdicaoReserva');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
        // Aguardar o modal fechar antes de fazer dispose
        modalElement.addEventListener('hidden.bs.modal', () => {
          modal.dispose();
        }, { once: true });
      }
    }
  }

  selecionarHorario(horario: HorarioDisponivel) {
    if (horario.disponivel || this.isHorarioAtual(horario)) {
      this.horarioSelecionado = horario;
    }
  }

  isHorarioAtual(horario: HorarioDisponivel): boolean {
    return this.reservaParaEdicao?.horaInicio === horario.horaInicio && 
           this.reservaParaEdicao?.horaFim === horario.horaFim;
  }

  confirmarEdicao() {
    if (!this.reservaParaEdicao || !this.horarioSelecionado) {
      this.modalService.showWarning(
        'Seleção Obrigatória',
        'Selecione um horário para continuar'
      );
      return;
    }

    const updateRequest: ReservaUpdateRequest = {
      horaInicio: this.horarioSelecionado.horaInicio,
      horaFim: this.horarioSelecionado.horaFim,
      membros: this.convidadosEdicao.length > 0 ? this.convidadosEdicao : []
    };

    this.reservasService.atualizar(this.reservaParaEdicao.id, updateRequest).subscribe({
      next: (reservaAtualizada) => {
        this.modalService.showSuccess(
          'Reserva Atualizada',
          'Reserva atualizada com sucesso!'
        );
        this.carregarMinhasReservas();
        this.fecharModalEdicao();
      },
      error: (error) => {
        console.error('Erro ao atualizar reserva:', error);
        this.modalService.showError(
          'Erro ao Atualizar',
          'Erro ao atualizar reserva. Tente novamente.'
        );
      }
    });
  }

  formatarHorarioCompleto(horario: HorarioDisponivel): string {
    return `${horario.horaInicio.toString().padStart(2, '0')}:00 - ${horario.horaFim.toString().padStart(2, '0')}:00`;
  }

  // ========== MÉTODOS DO MODAL TODAS AS RESERVAS ==========
  
  abrirModalTodasReservas() {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }
    
    this.carregarTodasReservas();
    const modalElement = document.getElementById('modalTodasReservas');
    if (modalElement) {
      // Garantir que não há instância anterior
      const existingModal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (existingModal) {
        existingModal.dispose();
      }
      
      // Criar nova instância do modal
      const modal = new (window as any).bootstrap.Modal(modalElement, {
        backdrop: true,
        keyboard: true,
        focus: true
      });
      modal.show();
    }
  }

  fecharModalTodasReservas() {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }
    
    const modalElement = document.getElementById('modalTodasReservas');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
        // Aguardar o modal fechar antes de fazer dispose
        modalElement.addEventListener('hidden.bs.modal', () => {
          modal.dispose();
        }, { once: true });
      }
    }
    this.filtroStatus = '';
    this.filtroPeriodo = '';
  }

  carregarTodasReservas() {
    // Obter o usuário logado
    const usuarioLogado = this.authService.getUsuarioLogado();
    if (!usuarioLogado) {
      console.error('Usuário não logado tentou carregar todas as reservas');
      this.todasReservas = [];
      this.todasReservasFiltradas = [];
      return;
    }

    // Listar todas as reservas do usuário logado para o modal
    this.reservasService.listarPorUsuario(usuarioLogado.userId).subscribe({
      next: (reservas: ReservaResponse[]) => {
        this.todasReservas = reservas.map(reserva => ({
          ...reserva,
          data: this.formatarDataParaString(reserva.data)
        }));
        this.todasReservasFiltradas = [...this.todasReservas]; // Sem filtros
      },
      error: (error: any) => {
        console.error('Erro ao carregar todas as reservas do usuário:', error);
        this.todasReservas = [];
        this.todasReservasFiltradas = [];
      }
    });
  }

  aplicarFiltros() {
    let filtradas = [...this.todasReservas];

    // Filtro por status cancelada (considera canceladaPor admin ou associado)
    if (this.filtroStatus === 'cancelada') {
      filtradas = filtradas.filter(r => r.cancelada === true || r.canceladaPor === 'ADMIN' || r.canceladaPor === 'ASSOCIADO');
    } else if (this.filtroStatus === 'ativas') {
      filtradas = filtradas.filter(r => !r.cancelada && !r.canceladaPor);
    }

    // Filtro por período considerando data e hora do computador
    const agora = new Date();
    if (this.filtroPeriodo === 'futuras') {
      filtradas = filtradas.filter(r => {
        // Considera data e hora da reserva
        const dataReserva = this.criarDataHoraLocal(r.data, r.horaInicio);
        return dataReserva > agora;
      });
    } else if (this.filtroPeriodo === 'passadas') {
      filtradas = filtradas.filter(r => {
        const dataReserva = this.criarDataHoraLocal(r.data, r.horaFim);
        return dataReserva < agora;
      });
    } else if (this.filtroPeriodo === 'hoje') {
      filtradas = filtradas.filter(r => {
        const dataReserva = this.criarDataLocal(r.data);
        const hoje = new Date();
        return dataReserva.getFullYear() === hoje.getFullYear() &&
               dataReserva.getMonth() === hoje.getMonth() &&
               dataReserva.getDate() === hoje.getDate();
      });
    }
    this.todasReservasFiltradas = filtradas;
  }

  // Método auxiliar para obter o motivo do cancelamento pelo admin
  public getMotivoCancelamento(reserva: any): string | null {
    if (reserva.status === 'cancelada' && reserva.canceladaPor === 'admin' && reserva.motivoCancelamento) {
      return reserva.motivoCancelamento as string;
    }
    return null;
  }



  // Cria um objeto Date com data e hora local a partir da string de data e hora (hora em decimal)
  private criarDataHoraLocal(dataString: string, horaDecimal: number): Date {
    const [ano, mes, dia] = dataString.split('-').map(Number);
    const horas = Math.floor(horaDecimal);
    const minutos = Math.round((horaDecimal - horas) * 60);
    return new Date(ano, mes - 1, dia, horas, minutos, 0, 0);
  }

  // Método para abrir o modal de todas as reservas a partir da navbar de quadras
  abrirModalTodasReservasViaNavbar() {
    this.abrirModalTodasReservas();
  }


  // Método auxiliar para criar data local sem problemas de fuso horário
  private criarDataLocal(dataString: string): Date {
    const [ano, mes, dia] = dataString.split('-').map(Number);
    return new Date(ano, mes - 1, dia); // mes - 1 porque Date usa 0-indexado para meses
  }


  // ========== MÉTODOS DE GERENCIAMENTO DE CONVIDADOS NA EDIÇÃO ==========
  
  adicionarConvidadoEdicao() {
    if (!this.nomeConvidadoEdicaoTemp.trim()) {
      this.modalService.showWarning(
        'Campo Obrigatório',
        'Por favor, informe o nome do convidado.'
      );
      return;
    }

    const nomeFormatado = this.formatarNome(this.nomeConvidadoEdicaoTemp.trim());
    
    // Verificar se o nome já existe (case insensitive)
    const nomeExiste = this.convidadosEdicao.some(nome => 
      nome.toLowerCase() === nomeFormatado.toLowerCase()
    );
    
    if (nomeExiste) {
      this.modalService.showWarning(
        'Convidado Duplicado',
        'Este convidado já foi adicionado à lista.'
      );
      return;
    }

    if (this.editandoConvidadoEdicaoIndex >= 0) {
      // Editando convidado existente
      this.convidadosEdicao[this.editandoConvidadoEdicaoIndex] = nomeFormatado;
      this.editandoConvidadoEdicaoIndex = -1;
    } else {
      // Adicionando novo convidado
      this.convidadosEdicao.push(nomeFormatado);
    }

    this.nomeConvidadoEdicaoTemp = '';
  }

  editarConvidadoEdicao(index: number) {
    this.nomeConvidadoEdicaoTemp = this.convidadosEdicao[index];
    this.editandoConvidadoEdicaoIndex = index;
  }

  removerConvidadoEdicao(index: number) {
    this.modalService.showConfirm(
      'Remover Convidado',
      'Tem certeza que deseja remover este convidado?',
      () => {
        this.convidadosEdicao.splice(index, 1);
      },
      undefined,
      'Remover',
      'Cancelar'
    );
  }

  formatarNome(nome: string): string {
    // Formatar nome: primeira letra de cada palavra em maiúscula
    return nome.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  getMaximoConvidadosEdicao(): number {
    if (!this.reservaParaEdicao) return 0;
    // Buscar quadra para pegar o qtdPessoas
    return 20; // Por enquanto fixo, mas deveria vir da quadra
  }

  // ========== MÉTODOS AUXILIARES ==========

  // Método para limpar qualquer modal que possa estar travado
  limparModaisTravados() {
    // Verificar se estamos no navegador (não no servidor)
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }
    
    const modalBackdrops = document.querySelectorAll('.modal-backdrop');
    modalBackdrops.forEach(backdrop => backdrop.remove());
    
    const body = document.body;
    body.classList.remove('modal-open');
    body.style.overflow = '';
    body.style.paddingRight = '';
    
    // Limpar todos os modais
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modalEl => {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      if (modal) {
        modal.dispose();
      }
    });
  }

  // Método para obter o caminho correto da imagem
  getImagePath(quadra: any): string {
  try {
    if (!quadra) {
      console.warn('getImagePath: quadra é undefined ou null');
      return '/quadras/futebol.png';
    }
    if (quadra.img) {
      if (typeof quadra.img !== 'string') {
        console.error('getImagePath: img não é string', quadra.img);
        return '/quadras/futebol.png';
      }
      if (quadra.img.startsWith('http') || quadra.img.startsWith('/')) {
        return quadra.img;
      }
      // Sempre buscar da pasta pública quadras
      return `/quadras/${quadra.img}`;
    }
    console.warn('getImagePath: quadra.img não definido', quadra);
    return '/quadras/futebol.png';
  } catch (error) {
    console.error('Erro em getImagePath:', error, quadra);
    return '/quadras/futebol.png';
  }
}


  // Métodos para upload de imagem de perfil
  carregarPerfilUsuario() {
    this.authService.obterPerfil().subscribe({
      next: (response) => {
        this.usuarioLogado = response;
        this.fotoPerfilPreview = response.fotoPerfil || null;
      },
      error: (error) => {
        console.error('Erro ao carregar perfil:', error);
      }
    });
  }

  onFileSelectedProfile(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validações
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem');
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB
        alert('A imagem deve ter no máximo 10MB');
        return;
      }

      this.selectedFileProfile = file;

      // Preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        this.fotoPerfilPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  // Método para obter URL da imagem de perfil
  getFotoPerfilUrl(): string {
    // Se está selecionando uma nova imagem
    if (this.fotoPerfilPreview && this.fotoPerfilPreview.startsWith('data:image/')) {
      return this.fotoPerfilPreview;
    }
    // Se o usuário tem foto de perfil salva
    if (this.usuarioLogado && this.usuarioLogado.fotoPerfil) {
      if (this.usuarioLogado.fotoPerfil.startsWith('http')) {
        return this.usuarioLogado.fotoPerfil;
      }
      // Monta a URL do backend para a imagem
      return `http://localhost:8080/api/imagens/perfil/${this.usuarioLogado.fotoPerfil.replace(/^.*[\\\/]/, '')}`;
    }
    // Imagem padrão de perfil
    return '/home-socio/perfil.jpg';
  }

  uploadFotoPerfil() {
    if (!this.selectedFileProfile) {
      alert('Selecione uma imagem primeiro');
      return;
    }

    this.isUploadingPhoto = true;
    this.authService.uploadFotoPerfil(this.selectedFileProfile).subscribe({
      next: (response) => {
        // Após upload, limpar preview e forçar atualização
        this.selectedFileProfile = null;
        this.fotoPerfilPreview = null;
        // Forçar atualização do usuário logado no AuthService
        this.authService.obterPerfil().subscribe({
          next: (perfilAtualizado) => {
            this.usuarioLogado = perfilAtualizado;
            // Forçar sincronização do localStorage e BehaviorSubject
            this.authService.restaurarUsuarioDoLocalStorage();
            console.log('Perfil atualizado:', perfilAtualizado);
          },
          error: (error) => {
            console.error('Erro ao recarregar perfil:', error);
          }
        });
        this.isUploadingPhoto = false;
        alert('Foto atualizada com sucesso!');
      },
      error: (error) => {
        console.error('Erro ao fazer upload:', error);
        alert(error.error?.error || 'Erro ao fazer upload da foto');
        this.isUploadingPhoto = false;
      }
    });
  }

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = '/home-socio/perfil.jpg';
    }
  }

  // ========== CANCELAMENTO DE RESERVA ==========

  abrirModalConfirmacaoCancelamento(reserva: ReservaResponse): void {
    this.reservaParaCancelar = reserva;
    
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

    this.reservasService.deletar(this.reservaParaCancelar.id).subscribe({
      next: () => {
        // Remover da lista local de minhas reservas
        const index = this.minhasReservas.findIndex(r => r.id === this.reservaParaCancelar!.id);
        if (index > -1) {
          this.minhasReservas.splice(index, 1);
        }

        // Atualizar status na lista de todas as reservas também
        const indexTodas = this.todasReservas.findIndex(r => r.id === this.reservaParaCancelar!.id);
        if (indexTodas > -1) {
          this.todasReservas[indexTodas].cancelada = true;
          this.todasReservas[indexTodas].canceladaPor = 'associado';
          this.todasReservas[indexTodas].status = 'cancelada';
        }

        // Recarregar todas as reservas para garantir consistência
        this.carregarMinhasReservas();
        
        // Aplicar filtros novamente
        this.aplicarFiltros();

        // Fechar modal
        this.fecharModalConfirmacaoCancelamento();

        // Mostrar mensagem de sucesso
        this.mostrarModalSucesso();
      },
      error: (error: any) => {
        console.error('Erro ao cancelar reserva:', error);
        this.mostrarModalErro();
      }
    });
  }

  fecharModalConfirmacaoCancelamento(): void {
    this.reservaParaCancelar = null;
    
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

  mostrarModalSucesso(): void {
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      const modalElement = document.getElementById('modalSucessoCancelamento');
      if (modalElement) {
        const modal = new (window as any).bootstrap.Modal(modalElement);
        modal.show();
      }
    }
  }

  mostrarModalErro(): void {
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      const modalElement = document.getElementById('modalErroCancelamento');
      if (modalElement) {
        const modal = new (window as any).bootstrap.Modal(modalElement);
        modal.show();
      }
    }
  }
}
