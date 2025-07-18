import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CadastroSocioComponent } from './cadastro-socio.component';
import { CadastroServiceService } from '../../../services/cadastro-service.service';
import { CadastroDadosService } from '../../../services/cadastro-dados.service';

describe('CadastroSocioComponent', () => {
  let component: CadastroSocioComponent;
  let fixture: ComponentFixture<CadastroSocioComponent>;
  let router: jasmine.SpyObj<Router>;
  let cadastroDadosService: jasmine.SpyObj<CadastroDadosService>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const cadastroDadosServiceSpy = jasmine.createSpyObj('CadastroDadosService', ['setDados']);

    await TestBed.configureTestingModule({
      imports: [CadastroSocioComponent, HttpClientTestingModule, FormsModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: CadastroDadosService, useValue: cadastroDadosServiceSpy },
        CadastroServiceService
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CadastroSocioComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    cadastroDadosService = TestBed.inject(CadastroDadosService) as jasmine.SpyObj<CadastroDadosService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form data', () => {
    expect(component.dadosCadastro.nome).toBe('');
    expect(component.dadosCadastro.cpf).toBe('');
    expect(component.dadosCadastro.email).toBe('');
    expect(component.dadosCadastro.telefone).toBe('');
    expect(component.dadosCadastro.senha).toBe('');
  });

  it('should save data and navigate to password page on next step', () => {
    component.dadosCadastro = {
      nome: 'João Silva',
      cpf: '123.456.789-01',
      email: 'joao@teste.com',
      telefone: '(11) 99999-9999',
      senha: ''
    };

    component.proximoPasso();

    expect(cadastroDadosService.setDados).toHaveBeenCalledWith(component.dadosCadastro);
    expect(router.navigate).toHaveBeenCalledWith(['/cadastro/senha']);
  });

  it('should clear specific field', () => {
    component.dadosCadastro.nome = 'João Silva';
    component.dadosCadastro.email = 'joao@teste.com';

    component.limparCampo('nome');
    expect(component.dadosCadastro.nome).toBe('');
    expect(component.dadosCadastro.email).toBe('joao@teste.com');

    component.limparCampo('email');
    expect(component.dadosCadastro.email).toBe('');
  });

  it('should format CPF correctly', () => {
    expect(component.formatarCpf('12345678901')).toBe('123.456.789-01');
    expect(component.formatarCpf('123456789')).toBe('123.456.789');
    expect(component.formatarCpf('123456')).toBe('123.456');
    expect(component.formatarCpf('123')).toBe('123');
    expect(component.formatarCpf('123456789012')).toBe('123.456.789-01'); // Should limit to 11 digits
  });

  it('should format telephone correctly', () => {
    expect(component.formatarTelefone('11999999999')).toBe('(11) 99999-9999');
    expect(component.formatarTelefone('1199999999')).toBe('(11) 9999-9999');
    expect(component.formatarTelefone('119999999')).toBe('(11) 99999-99');
    expect(component.formatarTelefone('11999')).toBe('(11) 999');
    expect(component.formatarTelefone('11')).toBe('(11) ');
    expect(component.formatarTelefone('119999999999')).toBe('(11) 99999-9999'); // Should limit to 11 digits
  });

  it('should validate email correctly', () => {
    expect(component.emailValido('teste@teste.com')).toBeTrue();
    expect(component.emailValido('usuario@dominio.com.br')).toBeTrue();
    expect(component.emailValido('teste@')).toBeFalse();
    expect(component.emailValido('teste')).toBeFalse();
    expect(component.emailValido('@teste.com')).toBeFalse();
    expect(component.emailValido('teste.com')).toBeFalse();
    expect(component.emailValido('')).toBeFalse();
  });

  it('should handle special characters in CPF formatting', () => {
    expect(component.formatarCpf('123.456.789-01')).toBe('123.456.789-01');
    expect(component.formatarCpf('abc123def456ghi789jkl01')).toBe('123.456.789-01');
  });

  it('should handle special characters in telephone formatting', () => {
    expect(component.formatarTelefone('+55 11 99999-9999')).toBe('(55) 11999-9999');
    expect(component.formatarTelefone('abc11def99999ghi9999')).toBe('(11) 99999-9999');
  });
});
