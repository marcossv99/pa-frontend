import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { QuadrasService, QuadraResponse } from '../../../services/quadras.service';
import { ModalService } from '../../../services/modal.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-cadastro-quadra',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './cadastro-quadra.component.html',
  styleUrl: './cadastro-quadra.component.css'
})
export class CadastroQuadraComponent implements OnInit {
  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = '/home-socio/futebol-quadra.png';
    }
  }
  quadraForm: FormGroup;
  selectedFiles: File[] = [];
  imagePreviews: string[] = []; // Para imagem atual (edição)
  newImagePreviews: string[] = []; // Para novas imagens selecionadas
  editId?: number;
  isEdit = false;

  constructor(
    private fb: FormBuilder,
    public router: Router,
    private route: ActivatedRoute,
    private quadrasService: QuadrasService,
    private http: HttpClient,
    private modalService: ModalService
  ) {
    this.quadraForm = this.fb.group({
      numero: ['', Validators.required],
      modalidade: ['', Validators.required],
      qtdPessoas: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.editId = +params['id'];
        this.isEdit = true;
        this.quadrasService.buscarPorId(this.editId).subscribe({
          next: (quadra: QuadraResponse) => {
            this.quadraForm.patchValue({
              numero: quadra.numero,
              modalidade: quadra.modalidade,
              qtdPessoas: quadra.qtdPessoas
            });
            if (quadra.img) {
              this.imagePreviews = [this.getImagePath(quadra.img)];
            }
          },
          error: () => {
            alert('Erro ao carregar dados da quadra para edição.');
          }
        });
      }
    });
  }

  getImagePath(imageName: string | undefined): string {
    // Se não há nome de imagem, retorna a imagem padrão
    if (!imageName) {
      return '/home-socio/futebol-quadra.png';
    }
    // Se já contém o path completo ou é URL, retorna como está
    if (imageName.includes('/') || imageName.includes('http')) {
      return imageName;
    }
    // Sempre buscar da pasta pública quadras
    return `/quadras/${imageName}`;
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files).slice(0, 3);
      this.selectedFiles = files;
      this.newImagePreviews = [];
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.newImagePreviews.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  cadastrarQuadra() {
    if (this.quadraForm.valid) {
      console.log('Dados do formulário:', this.quadraForm.value);
      console.log('Arquivos selecionados:', this.selectedFiles);
      
      const formData = new FormData();
      formData.append('numero', this.quadraForm.value.numero);
      formData.append('modalidade', this.quadraForm.value.modalidade);
      formData.append('qtdPessoas', this.quadraForm.value.qtdPessoas);
      
      // Adicionar imagens apenas se foram selecionadas
      this.selectedFiles.forEach((file, idx) => {
        formData.append('imagens', file, file.name);
        console.log('Adicionada imagem:', file.name);
      });
      
      console.log('FormData criado, enviando requisição...');
      
      if (this.isEdit && this.editId) {
        console.log('Modo edição - ID:', this.editId);
        console.log('Imagens selecionadas:', this.selectedFiles.length);
        
        if (this.selectedFiles.length > 0) {
          // Edição com nova imagem - usar multipart
          console.log('Editando com nova imagem...');
          this.quadrasService.editar(this.editId, formData).subscribe({
            next: () => {
              this.modalService.showSuccess('Sucesso', 'Quadra editada com sucesso!');
              this.router.navigate(['/admin/lista-quadras']);
            },
            error: (error) => {
              console.error('Erro ao editar com imagem:', error);
              // Fallback: tentar editar sem imagem
              console.log('Tentando fallback sem imagem...');
              const dadosBasicos = {
                numero: this.quadraForm.value.numero,
                modalidade: this.quadraForm.value.modalidade,
                qtdPessoas: this.quadraForm.value.qtdPessoas
              };
              
              this.http.put(`/api/quadras/${this.editId}`, dadosBasicos).subscribe({
                next: () => {
                  this.modalService.showSuccess('Sucesso', 'Quadra editada com sucesso (sem alteração de imagem)!');
                  this.router.navigate(['/admin/lista-quadras']);
                },
                error: () => alert('Erro ao editar quadra!')
              });
            }
          });
        } else {
          // Edição sem nova imagem - usar JSON
          console.log('Editando sem nova imagem...');
          const dadosBasicos = {
            numero: this.quadraForm.value.numero,
            modalidade: this.quadraForm.value.modalidade,
            qtdPessoas: this.quadraForm.value.qtdPessoas
          };
          
          this.http.put(`/api/quadras/${this.editId}`, dadosBasicos).subscribe({
            next: () => {
              this.modalService.showSuccess('Sucesso', 'Quadra editada com sucesso!');
              this.router.navigate(['/admin/lista-quadras']);
            },
            error: () => alert('Erro ao editar quadra!')
          });
        }
      } else {
        // Para novo cadastro, exigir pelo menos uma imagem
        if (this.selectedFiles.length === 0) {
          alert('Selecione pelo menos uma imagem para a quadra.');
          return;
        }
        
        // Tentar primeiro com o endpoint principal (multipart)
        console.log('Tentando com FormData...');
        this.quadrasService.cadastrar(formData).subscribe({
          next: () => {
            this.modalService.showSuccess(
              'Cadastro realizado',
              'Quadra cadastrada com sucesso!'
            );
            setTimeout(() => {
              this.router.navigate(['/admin/lista-quadras']);
            }, 1500);
          },
          error: (error) => {
            console.error('Erro com FormData:', error);
            alert('Erro ao cadastrar quadra! Verifique os dados e tente novamente.')
          }
        });
      }
    } else {
      alert('Preencha todos os campos obrigatórios.');
    }
  }
}
