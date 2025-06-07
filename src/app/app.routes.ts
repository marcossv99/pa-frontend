import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { CommonModule } from '@angular/common';
import { CadastroSocioComponent } from './pages/cadastro/cadastro-socio/cadastro-socio.component';
import { SenhaComponent } from './pages/cadastro/senha/senha.component';
import { HomeAdminComponent } from './pages/home-admin/home-admin.component';

export const routes: Routes = [
    {
        path: '', redirectTo: 'login', pathMatch: 'full'
    },
    {
        path: 'login', component: LoginComponent, title: 'Login'
    },
    {
        path: 'cadastro', component: CadastroSocioComponent, title: 'Cadastro'
    },
    {
        path: 'cadastro/senha', component: SenhaComponent, title: 'Cadastro Senha'
    },
    {
        path: 'home', component: HomeAdminComponent, title: 'Home Admin',
    },
];
