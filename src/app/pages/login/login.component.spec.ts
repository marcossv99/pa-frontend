import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, HttpClientTestingModule, FormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form fields', () => {
    expect(component.cpfOuEmail).toBe('');
    expect(component.senha).toBe('');
    expect(component.msg).toBe('');
    expect(component.lembrarDeMim).toBeFalse();
    expect(component.mostrarSenha).toBeFalse();
  });

  it('should show error message when fields are empty', () => {
    component.cpfOuEmail = '';
    component.senha = '';
    component.fazerLogin();

    expect(component.msg).toBe('Preencha todos os campos.');
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should call authService.login with correct parameters', () => {
    const mockResponse = 'success';
    authService.login.and.returnValue(of(mockResponse));

    component.cpfOuEmail = 'teste@teste.com';
    component.senha = 'senha123';
    component.fazerLogin();

    expect(authService.login).toHaveBeenCalledWith('teste@teste.com', 'senha123');
  });

  it('should navigate to home on successful login', () => {
    const mockResponse = 'success';
    authService.login.and.returnValue(of(mockResponse));

    component.cpfOuEmail = 'teste@teste.com';
    component.senha = 'senha123';
    component.fazerLogin();

    expect(router.navigate).toHaveBeenCalledWith(['/home']);
    expect(component.msg).toBe('');
  });

  it('should show error message on login failure', () => {
    authService.login.and.returnValue(throwError(() => new Error('Login failed')));

    component.cpfOuEmail = 'teste@teste.com';
    component.senha = 'wrong-password';
    component.fazerLogin();

    expect(component.msg).toBe('Login falhou. Cheque suas credenciais.');
  });

  it('should toggle password visibility', () => {
    expect(component.mostrarSenha).toBeFalse();
    
    component.toggleMostrarSenha();
    expect(component.mostrarSenha).toBeTrue();
    
    component.toggleMostrarSenha();
    expect(component.mostrarSenha).toBeFalse();
  });

  it('should navigate to cadastro page', () => {
    component.irParaCadastro();
    expect(router.navigate).toHaveBeenCalledWith(['/cadastro']);
  });

  it('should format CPF correctly', () => {
    expect(component.formatarCpf('12345678901')).toBe('123.456.789-01');
    expect(component.formatarCpf('123456789')).toBe('123.456.789');
    expect(component.formatarCpf('123456')).toBe('123.456');
    expect(component.formatarCpf('123')).toBe('123');
  });

  it('should detect CPF format correctly', () => {
    expect(component.isCpf('123.456.789-01')).toBeTrue();
    expect(component.isCpf('12345678901')).toBeTrue();
    expect(component.isCpf('teste@teste.com')).toBeFalse();
    expect(component.isCpf('123456')).toBeFalse();
  });
});
