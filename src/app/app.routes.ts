import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { CommonModule } from '@angular/common';
import { CadastroSocioComponent } from './pages/cadastro/cadastro-socio/cadastro-socio.component';
import { SenhaComponent } from './pages/cadastro/senha/senha.component';
import { HomeAdminComponent } from './pages/admin/home-admin/home-admin.component';
import { HomeSocioComponent } from './pages/socio/home-socio/home-socio.component';
import { VisualizarQuadraComponent } from './pages/socio/visualizar-quadra/visualizar-quadra.component';
import { QuadrasSocioComponent } from './pages/socio/quadras-socio/quadras-socio.component';
import { ListaQuadrasComponent } from './pages/admin/lista-quadras/lista-quadras.component';
import { CadastroQuadraComponent } from './pages/admin/cadastro-quadra/cadastro-quadra.component';
import { DetalheQuadraComponent } from './pages/admin/detalhe-quadra/detalhe-quadra.component';
import { CadastroAdminComponent } from './pages/admin/cadastro-admin/cadastro-admin.component';
import { PerfilComponent } from './pages/socio/perfil/perfil.component';
import { AdminGuard } from './guards/admin.guard';
import { SocioGuard } from './guards/socio.guard';

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
        path: 'cadastro/socio', component: CadastroSocioComponent, title: 'Cadastro de Sócio'
    },
    {
        path: 'cadastro/senha', component: SenhaComponent, title: 'Cadastro Senha'
    },
    {
        path: 'socio', 
        canActivate: [SocioGuard],
        children: [
            { path: '', component: HomeSocioComponent, title: 'Home Sócio' },
            { path: 'home', component: HomeSocioComponent, title: 'Home Sócio' },
            { path: 'perfil', component: PerfilComponent, title: 'Meu Perfil' },
            { path: 'quadras', component: QuadrasSocioComponent, title: 'Quadras Disponíveis' },
            { path: 'visualizar-quadra/:id', component: VisualizarQuadraComponent, title: 'Reservar Quadra' }
        ]
    },
    {
        path: 'volei', redirectTo: 'home', pathMatch: 'full'
    },
    {
        path: 'admin/home', 
        component: HomeAdminComponent, 
        title: 'Home Admin',
        canActivate: [AdminGuard]
    },
    {
        path: 'admin/dashboard', 
        component: HomeAdminComponent, 
        title: 'Dashboard Admin',
        canActivate: [AdminGuard]
    },
    {
        path: 'admin/cadastro-admin', 
        component: CadastroAdminComponent, 
        title: 'Cadastro de Admin',
        canActivate: [AdminGuard]
    },
    {
        path: 'admin/lista-quadras',
        component: ListaQuadrasComponent,
        title: 'Quadras Cadastradas',
        canActivate: [AdminGuard]
    },
    {
        path: 'admin/cadastro-quadra',
        component: CadastroQuadraComponent,
        title: 'Cadastrar Quadra',
        canActivate: [AdminGuard]
    },
    {
        path: 'admin/cadastro-admin',
        component: CadastroAdminComponent,
        title: 'Cadastrar Administrador',
        canActivate: [AdminGuard]
    },
    {
        path: 'admin/detalhe-quadra/:id',
        component: DetalheQuadraComponent,
        title: 'Detalhes da Quadra',
        canActivate: [AdminGuard]
    },
    {
        path: '**', redirectTo: 'login', pathMatch: 'full'
    }
];
