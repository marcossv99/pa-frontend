import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { QuadrasService } from '../../../services/quadras.service';
import { ReservasService, ReservaRequest } from '../../../services/reservas.service';
import { AuthService } from '../../../services/auth.service';
import { ModalService } from '../../../services/modal.service';

interface Reserva {
  nome: string;
  convidados: string[];
  quadraId?: number;
  quadraNome?: string;
  data: string;
  horarios: string;
}

interface Horario {
  id: number;
  hora: string;
  disponivel: boolean;
}

interface Quadra {
  id: number;
  numero: number;
  modalidade: string;
  qtdPessoas: number;
  img?: string;
  isDisponivel?: boolean;
}

@Component({
  selector: 'app-visualizar-quadra',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './visualizar-quadra.component.html',
  styleUrl: './visualizar-quadra.component.css'
})
export class VisualizarQuadraComponent implements OnInit {

  abrirModalTodasReservas() {
    // Implemente a lógica do modal de reservas se necessário
    // Por padrão, apenas exibe um log
    console.log('abrirModalTodasReservas chamado');
  }

  navegarParaPerfil() {
    this.router.navigate(['/socio/perfil']);
  }

  navegarParaHome() {
    this.router.navigate(['/socio/home']);
  }

  abrirModalConvidados() {
    console.log('Abrindo modal de convidados...');
    this.mostrarModalConvidados = true;
    this.nomeConvidadoTemp = '';
    this.editandoConvidadoIndex = -1;
    this.cdr.detectChanges();
    console.log('Modal de convidados aberto:', this.mostrarModalConvidados);
  }

  fecharModalConvidados() {
    this.mostrarModalConvidados = false;
    this.editandoConvidadoIndex = -1;
    this.nomeConvidadoTemp = '';
  }

  onDataChange(event: any) {
    this.dataSelecionada = event.target.value;
    this.horariosSelecionados = [];
    this.carregarHorariosDisponiveis();
  }

  // Adiciona métodos utilitários que estavam faltando
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  carregarHorariosDisponiveis() {
    // Aqui você pode implementar a lógica real de buscar horários do backend se necessário
    // Por padrão, apenas gera localmente
    this.horarios = this.gerarHorariosDisponiveis();
  }

  getHorariosSelecionadosTexto(): string {
    return this.horarios
      .filter(h => this.horariosSelecionados.includes(h.id))
      .map(h => h.hora)
      .join(', ');
  }
  quadra: Quadra | null = null;
  dataSelecionada: string = '';
  horariosSelecionados: number[] = [];
  nomeCompleto: string = '';
  quantidadeConvidados: number = 0;
  dataMinima: string = '';
  reservaConfirmada: Reserva | null = null;
  convidados: string[] = [];
  nomeConvidadoTemp: string = '';
  mostrarModalConvidados: boolean = false;
  editandoConvidadoIndex: number = -1;
  horarios: Horario[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quadrasService: QuadrasService,
    private reservasService: ReservasService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private modalService: ModalService
  ) {
    // Definir data de hoje como padrão
    const hoje = new Date();
    this.dataSelecionada = this.formatDate(hoje);
    this.dataMinima = this.formatDate(hoje);
    this.horarios = this.gerarHorariosDisponiveis();
  }

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.carregarQuadra(id);
    this.preencherNomeUsuarioLogado();
  }

  gerarHorariosDisponiveis(): Horario[] {
    const horarios: Horario[] = [];
    for (let hora = 6; hora <= 21; hora++) {
      horarios.push({
        id: hora - 5,
        hora: `${hora.toString().padStart(2, '0')}:00 - ${(hora + 1).toString().padStart(2, '0')}:00`,
        disponivel: this.isHorarioDisponivel(hora)
      });
    }
    return horarios;
  }

  isHorarioDisponivel(hora: number): boolean {
    const agora = new Date();
    const dataAtual = this.formatDate(agora);
    const horaAtual = agora.getHours();
    if (this.dataSelecionada === dataAtual) {
      return hora > horaAtual;
    }
    const dataSelecionadaObj = this.criarDataLocal(this.dataSelecionada);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataSelecionadaObj.setHours(0, 0, 0, 0);
    return dataSelecionadaObj >= hoje;
  }

  private criarDataLocal(dataString: string): Date {
    const [ano, mes, dia] = dataString.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
  }

  preencherNomeUsuarioLogado() {
    const usuarioLogado = this.authService.getUsuarioLogado();
    if (usuarioLogado && usuarioLogado.nome) {
      this.nomeCompleto = usuarioLogado.nome;
      console.log('Nome do usuário logado preenchido automaticamente:', usuarioLogado.nome);
    } else {
      console.warn('Usuário não está logado ou nome não disponível');
    }
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

  onImageError(event: Event, imageName: string | undefined) {
    const target = event.target as HTMLImageElement;
    if (!imageName) {
      target.src = '/home-socio/futebol-quadra.png';
    }
  }

  carregarQuadra(id: number) {
    this.quadrasService.buscarPorId(id).subscribe({
      next: (quadra: any) => {
        this.quadra = quadra;
        this.carregarHorariosDisponiveis();
      },
      error: (error: any) => {
        console.error('Erro ao carregar quadra:', error);
        this.quadra = {
          id: id,
          numero: 1,
          modalidade: 'Futebol',
          qtdPessoas: 22,
          img: undefined
        };
        this.carregarHorariosDisponiveis();
      }
    });
  }

  isHorarioSelecionado(horarioId: number): boolean {
    return this.horariosSelecionados.includes(horarioId);
  }

  toggleHorario(horarioId: number) {
    if (this.isHorarioSelecionado(horarioId)) {
      this.horariosSelecionados = this.horariosSelecionados.filter(id => id !== horarioId);
    } else {
      // Validação: apenas um horário pode ser selecionado por vez
      if (this.horariosSelecionados.length > 0) {
        this.modalService.showWarning(
          'Seleção Limitada',
          'Você só pode selecionar um horário por reserva. Para selecionar outro horário, primeiro desmarque o atual.'
        );
        return;
      }
      this.horariosSelecionados = [horarioId]; // Substitui qualquer seleção anterior
    }
  }

  getOpcoesQuantidadeConvidados(): number[] {
    if (!this.quadra) return [0];
    const max = this.getMaximoConvidados();
    return Array.from({ length: max + 1 }, (_, i) => i);
  }

  getMaximoConvidados(): number {
    return this.quadra ? this.quadra.qtdPessoas - 1 : 0;
  }

  onQuantidadeConvidadosChange() {
    console.log('Quantidade de convidados alterada para:', this.quantidadeConvidados);
    console.log('Convidados atuais:', this.convidados);
    
    if (this.quantidadeConvidados < this.convidados.length) {
      this.convidados = this.convidados.slice(0, this.quantidadeConvidados);
    }
    if (this.quantidadeConvidados === 0) {
      this.convidados = [];
    } else if (this.quantidadeConvidados > 0 && this.convidados.length === 0) {
      // Abrir o modal automaticamente quando o usuário seleciona convidados pela primeira vez
      console.log('Abrindo modal de convidados automaticamente...');
      setTimeout(() => {
        this.abrirModalConvidados();
      }, 50);
    }
  }

  adicionarConvidado() {
    if (!this.nomeConvidadoTemp || this.nomeConvidadoTemp.trim().length === 0) {
      this.modalService.showWarning(
        'Campo Obrigatório',
        'Por favor, informe o nome do convidado.'
      );
      return;
    }

    const nomeFormatado = this.formatarNome(this.nomeConvidadoTemp.trim());
    
    // Verificar se o nome já existe na lista
    if (this.convidados.includes(nomeFormatado)) {
      this.modalService.showWarning(
        'Nome Duplicado',
        'Este convidado já está na lista.'
      );
      return;
    }

    // Verificar se não excede o limite
    if (this.convidados.length >= this.quantidadeConvidados) {
      this.modalService.showWarning(
        'Limite Excedido',
        `Você só pode adicionar ${this.quantidadeConvidados} convidado(s).`
      );
      return;
    }

    if (this.editandoConvidadoIndex >= 0) {
      // Editando convidado existente
      this.convidados[this.editandoConvidadoIndex] = nomeFormatado;
      this.editandoConvidadoIndex = -1;
    } else {
      // Adicionando novo convidado
      this.convidados.push(nomeFormatado);
    }

    // Limpar o campo
    this.nomeConvidadoTemp = '';
    
    // Atualizar a detecção de mudanças
    this.cdr.detectChanges();
    
    // Se a lista estiver completa, fechar o modal
    if (this.isListaConvidadosCompleta()) {
      this.fecharModalConvidados();
      this.modalService.showSuccess(
        'Lista Completa',
        'Todos os convidados foram adicionados com sucesso!'
      );
    }
  }

  editarConvidado(index: number) {
    this.nomeConvidadoTemp = this.convidados[index];
    this.editandoConvidadoIndex = index;
  }

  removerConvidado(index: number) {
    this.modalService.showConfirm(
      'Remover Convidado',
      'Tem certeza que deseja remover este convidado?',
      () => {
        this.convidados.splice(index, 1);
        this.cdr.detectChanges();
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

  getConvidadosFaltando(): number {
    return this.quantidadeConvidados - this.convidados.length;
  }

  get podeConfirmarLista(): boolean {
    return this.isListaConvidadosCompleta();
  }

  isListaConvidadosCompleta(): boolean {
    // Se quantidade selecionada é 0, a lista está completa (sem convidados)
    if (this.quantidadeConvidados === 0) {
      return true;
    }
    
    // Caso contrário, verifica se o número de convidados adicionados é igual ao selecionado
    return Number(this.convidados.length) === Number(this.quantidadeConvidados);
  }

  isReservaCompleta(): boolean {
    return !!(
      this.nomeCompleto.trim() &&
      this.dataSelecionada &&
      this.horariosSelecionados.length > 0 &&
      this.isListaConvidadosCompleta()
    );
  }

  confirmarReserva() {
    if (!this.isReservaCompleta()) {
      return;
    }

    // Validação: verificar se já existe reserva na mesma quadra no mesmo dia
    this.validarReservaDuplicada().then((podeReservar) => {
      if (!podeReservar) {
        this.modalService.showError(
          'Reserva Não Permitida',
          'Você já possui uma reserva nesta quadra para este dia. Não é possível fazer múltiplas reservas na mesma quadra no mesmo dia.'
        );
        return;
      }

      // Prosseguir com a reserva
      this.processarReserva();
    });
  }

  private async validarReservaDuplicada(): Promise<boolean> {
    try {
      const usuarioLogado = this.authService.getUsuarioLogado();
      if (!usuarioLogado || !usuarioLogado.userId) {
        return false;
      }

      // Buscar todas as reservas do usuário
      const reservasUsuario = await this.reservasService.listarPorUsuario(usuarioLogado.userId).toPromise();
      
      // Verificar se há alguma reserva na mesma quadra e data (que não seja cancelada)
      const reservaExistenteMesmaQuadra = reservasUsuario?.find(reserva => 
        reserva.quadraId === this.quadra!.id && 
        reserva.data === this.dataSelecionada &&
        !reserva.cancelada // Não considerar reservas canceladas
      );

      if (reservaExistenteMesmaQuadra) {
        this.modalService.showError(
          'Reserva Não Permitida',
          'Você já possui uma reserva nesta quadra para este dia. Não é possível fazer múltiplas reservas na mesma quadra no mesmo dia.'
        );
        return false;
      }

      // Buscar todas as quadras para verificar modalidades
      const todasQuadras = await this.quadrasService.listar().toPromise();
      
      // Verificar se há alguma reserva do mesmo tipo de quadra na mesma data (que não seja cancelada)
      const reservaExistenteMesmaModalidade = reservasUsuario?.find(reserva => {
        if (reserva.data === this.dataSelecionada && !reserva.cancelada) {
          // Buscar modalidade da quadra da reserva existente
          const quadraReserva = todasQuadras?.find(q => q.id === reserva.quadraId);
          return quadraReserva?.modalidade === this.quadra!.modalidade;
        }
        return false;
      });

      if (reservaExistenteMesmaModalidade) {
        this.modalService.showError(
          'Reserva Não Permitida',
          `Você já possui uma reserva para quadra de ${this.quadra!.modalidade} neste dia. Não é possível fazer múltiplas reservas do mesmo tipo de quadra no mesmo dia.`
        );
        return false;
      }

      return true; // Pode fazer a reserva
    } catch (error) {
      console.error('Erro ao validar reserva duplicada:', error);
      // Em caso de erro na validação, permitir a reserva (o backend validará novamente)
      return true;
    }
  }

  private processarReserva() {
    // Converter horários selecionados para string de horas
    const horariosTexto = this.getHorariosSelecionadosTexto();
    
    // Ordenar horários selecionados
    const horariosSelecionadosOrdenados = [...this.horariosSelecionados].sort((a, b) => a - b);
    
    const primeiroHorario = this.horarios.find(h => h.id === horariosSelecionadosOrdenados[0]);
    const ultimoHorario = this.horarios.find(h => h.id === horariosSelecionadosOrdenados[horariosSelecionadosOrdenados.length - 1]);

    if (!primeiroHorario || !ultimoHorario) return;

    // Extrair hora início e fim do formato "HH:00 - HH:00"
    const horaInicio = parseFloat(primeiroHorario.hora.split(':')[0]);
    // Para o horário de fim, pegar a hora final do último horário selecionado
    const horaFim = parseFloat(ultimoHorario.hora.split(' - ')[1].split(':')[0]);

    console.log('Debug - Primeiro horário:', primeiroHorario.hora);
    console.log('Debug - Último horário:', ultimoHorario.hora);
    console.log('Debug - Hora início:', horaInicio);
    console.log('Debug - Hora fim:', horaFim);

    // Validar se horaFim é maior que horaInicio
    if (horaFim <= horaInicio) {
      this.modalService.showError(
        'Erro na Seleção',
        'Erro na seleção de horários. Tente novamente.'
      );
      return;
    }

    // Garantir que quadraId é number
    const quadraId = Number(this.quadra!.id);

    // Preparar dados da reserva
    const reservaData: ReservaRequest = {
      quadraId: quadraId,
      data: this.dataSelecionada,
      horaInicio: horaInicio,
      horaFim: horaFim,
      membros: this.convidados.length > 0 ? this.convidados : []
    };

    // Obter usuário logado
    const usuarioLogado = this.authService.getUsuarioLogado();
    if (usuarioLogado && usuarioLogado.userId) {
      reservaData.usuarioId = usuarioLogado.userId;
      console.log('Usuário logado encontrado:', usuarioLogado.nome, '(ID:', usuarioLogado.userId, ')');
    } else {
      console.warn('Nenhum usuário logado encontrado - usando usuário padrão');
    }

    console.log('Enviando reserva:', reservaData);

    // Enviar para o backend
    this.reservasService.criar(reservaData).subscribe({
      next: (reservaCriada) => {
        console.log('Reserva criada com sucesso:', reservaCriada);
        this.reservaConfirmada = {
          nome: this.nomeCompleto,
          convidados: this.convidados,
          quadraId: quadraId,
          quadraNome: `Quadra ${this.quadra?.numero} - ${this.quadra?.modalidade}`,
          data: this.dataSelecionada,
          horarios: horariosTexto
        };
        this.abrirModalConfirmacao();
      },
      error: (error) => {
        console.error('Erro ao criar reserva:', error);
        
        // Extrair mensagem de erro específica do backend
        let mensagemErro = 'Erro ao confirmar reserva. Tente novamente.';
        
        if (error.error && error.error.error) {
          mensagemErro = error.error.error;
        } else if (error.message) {
          mensagemErro = error.message;
        }
        
        // Verificar tipos de erro específicos para mensagens mais amigáveis
        if (mensagemErro.includes('já possui uma reserva no horário')) {
          this.modalService.showError(
            'Conflito de Horário',
            `${mensagemErro}<br><br>💡 <strong>Regra:</strong> Não é possível ter duas reservas no mesmo horário.`
          );
        } else if (mensagemErro.includes('já possui uma reserva para esta data')) {
          this.modalService.showError(
            'Limite Diário',
            `${mensagemErro}<br><br>💡 <strong>Regra:</strong> Apenas uma reserva por dia é permitida.`
          );
        } else if (mensagemErro.includes('já possui uma reserva')) {
          this.modalService.showError(
            'Reserva Existente',
            mensagemErro
          );
        } else if (mensagemErro.includes('já está reservada')) {
          this.modalService.showError(
            'Horário Indisponível',
            `${mensagemErro}<br><br>Por favor, selecione outro horário.`
          );
        } else if (mensagemErro.includes('horário')) {
          this.modalService.showError(
            'Erro de Horário',
            mensagemErro
          );
        } else {
          this.modalService.showError(
            'Erro na Reserva',
            mensagemErro
          );
        }
        
        // Recarregar horários para refletir mudanças
        this.carregarHorariosDisponiveis();
      }
    });
  }

  abrirModalConfirmacao() {
    // Usando Bootstrap modal via JavaScript
    const modalElement = document.getElementById('modalConfirmacao');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  voltarParaHome() {
    // Fecha o modal e navega para home
    const modalElement = document.getElementById('modalConfirmacao');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
    this.router.navigate(['/socio/home']);
  }

  voltar() {
    this.router.navigate(['/socio/home']);
  }
}
