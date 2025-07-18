import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PageChangeEvent {
  page: number;
  size: number;
}

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav aria-label="Navegação de páginas" *ngIf="totalPages > 1">
      <ul class="pagination pagination-sm justify-content-center">
        <!-- Primeira página -->
        <li class="page-item" [class.disabled]="currentPage === 0">
          <button class="page-link" 
                  (click)="changePage(0)" 
                  [disabled]="currentPage === 0"
                  aria-label="Primeira página">
            <i class="fas fa-angle-double-left"></i>
          </button>
        </li>
        
        <!-- Página anterior -->
        <li class="page-item" [class.disabled]="currentPage === 0">
          <button class="page-link" 
                  (click)="changePage(currentPage - 1)" 
                  [disabled]="currentPage === 0"
                  aria-label="Página anterior">
            <i class="fas fa-angle-left"></i>
          </button>
        </li>
        
        <!-- Números das páginas -->
        <li class="page-item" 
            *ngFor="let page of getPageNumbers()" 
            [class.active]="page === currentPage">
          <button class="page-link" 
                  (click)="changePage(page)"
                  [attr.aria-label]="'Página ' + (page + 1)"
                  [attr.aria-current]="page === currentPage ? 'page' : null">
            {{ page + 1 }}
          </button>
        </li>
        
        <!-- Próxima página -->
        <li class="page-item" [class.disabled]="currentPage === totalPages - 1">
          <button class="page-link" 
                  (click)="changePage(currentPage + 1)" 
                  [disabled]="currentPage === totalPages - 1"
                  aria-label="Próxima página">
            <i class="fas fa-angle-right"></i>
          </button>
        </li>
        
        <!-- Última página -->
        <li class="page-item" [class.disabled]="currentPage === totalPages - 1">
          <button class="page-link" 
                  (click)="changePage(totalPages - 1)" 
                  [disabled]="currentPage === totalPages - 1"
                  aria-label="Última página">
            <i class="fas fa-angle-double-right"></i>
          </button>
        </li>
      </ul>
      
      <!-- Info de páginas -->
      <div class="text-center small text-muted mt-2">
        Página {{ currentPage + 1 }} de {{ totalPages }} 
        ({{ totalElements }} {{ totalElements === 1 ? 'item' : 'itens' }})
      </div>
      
      <!-- Seletor de itens por página -->
      <div class="d-flex justify-content-center align-items-center mt-2 gap-2">
        <small class="text-muted">Itens por página:</small>
        <select class="form-select form-select-sm" 
                style="width: auto;"
                [value]="pageSize" 
                (change)="changePageSize($event)">
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </div>
    </nav>
  `,
  styles: [`
    .pagination .page-link {
      color: #0d6efd;
      border-color: #dee2e6;
    }
    
    .pagination .page-item.active .page-link {
      background-color: #0d6efd;
      border-color: #0d6efd;
    }
    
    .pagination .page-link:hover {
      background-color: #e9ecef;
    }
    
    .pagination .page-item.disabled .page-link {
      color: #6c757d;
      background-color: #fff;
      border-color: #dee2e6;
    }
  `]
})
export class PaginationComponent {
  @Input() currentPage = 0;
  @Input() totalPages = 0;
  @Input() totalElements = 0;
  @Input() pageSize = 10;
  @Input() maxVisiblePages = 5;
  
  @Output() pageChange = new EventEmitter<PageChangeEvent>();

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
      this.pageChange.emit({ page, size: this.pageSize });
    }
  }

  changePageSize(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newSize = parseInt(select.value, 10);
    this.pageChange.emit({ page: 0, size: newSize });
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const halfVisible = Math.floor(this.maxVisiblePages / 2);
    
    let startPage = Math.max(0, this.currentPage - halfVisible);
    let endPage = Math.min(this.totalPages - 1, startPage + this.maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < this.maxVisiblePages) {
      startPage = Math.max(0, endPage - this.maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}
