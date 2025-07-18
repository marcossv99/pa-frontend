export interface ReservaUsuario {
  id: number;
  usuarioNome: string;
  usuarioId: number;
  quadraNome: string;
  quadraId: number;
  quadraModalidade: string;
  data: string; // LocalDate do backend será convertido para string
  horaInicio: number;
  horaFim: number;
  status: string;
  membros: string[];
}
