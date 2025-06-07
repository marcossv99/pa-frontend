import { Component } from '@angular/core';

@Component({
  selector: 'app-home-admin',
  standalone: true,
  imports: [],
  templateUrl: './home-admin.component.html',
  styleUrl: './home-admin.component.css'
})
export class HomeAdminComponent {
  quadrasImagens: string[] = [
    '/images/quadra-futebol-1.png',
    // Adicione mais imagens aqui se desejar
    '/images/quadra-futebol-2.jpg',
    '/images/quadra-futebol-3.jpg'
  ];
  imagemAtual: number = 0;

  anteriorImagem() {
    this.imagemAtual = (this.imagemAtual - 1 + this.quadrasImagens.length) % this.quadrasImagens.length;
  }

  proximaImagem() {
    this.imagemAtual = (this.imagemAtual + 1) % this.quadrasImagens.length;
  }
}
