import { Injectable } from '@angular/core';

export interface ModalConfig {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private currentModal: ModalConfig | null = null;
  private modalElement: HTMLElement | null = null;

  constructor() {
    this.createModalElement();
  }

  private createModalElement(): void {
    // Remove modal existente se houver
    const existingModal = document.getElementById('globalModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Criar estrutura do modal
    const modalHtml = `
      <div class="modal fade" id="globalModal" tabindex="-1" aria-labelledby="globalModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header" id="globalModalHeader">
              <h5 class="modal-title" id="globalModalLabel">
                <i id="globalModalIcon" class="me-2"></i>
                <span id="globalModalTitle"></span>
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p id="globalModalMessage" class="mb-0"></p>
            </div>
            <div class="modal-footer" id="globalModalFooter">
              <!-- Botões serão inseridos dinamicamente -->
            </div>
          </div>
        </div>
      </div>
    `;

    // Adicionar ao DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    this.modalElement = document.getElementById('globalModal');
  }

  private updateModalContent(config: ModalConfig): void {
    if (!this.modalElement) return;

    const header = this.modalElement.querySelector('#globalModalHeader') as HTMLElement;
    const icon = this.modalElement.querySelector('#globalModalIcon') as HTMLElement;
    const title = this.modalElement.querySelector('#globalModalTitle') as HTMLElement;
    const message = this.modalElement.querySelector('#globalModalMessage') as HTMLElement;
    const footer = this.modalElement.querySelector('#globalModalFooter') as HTMLElement;

    // Configurar cores e ícones baseados no tipo
    switch (config.type) {
      case 'success':
        header.className = 'modal-header bg-success text-white';
        icon.className = 'bi bi-check-circle me-2';
        break;
      case 'error':
        header.className = 'modal-header bg-danger text-white';
        icon.className = 'bi bi-exclamation-triangle me-2';
        break;
      case 'warning':
        header.className = 'modal-header bg-warning text-dark';
        icon.className = 'bi bi-exclamation-triangle me-2';
        break;
      case 'info':
        header.className = 'modal-header bg-info text-white';
        icon.className = 'bi bi-info-circle me-2';
        break;
      case 'confirm':
        header.className = 'modal-header bg-primary text-white';
        icon.className = 'bi bi-question-circle me-2';
        break;
    }

    // Adicionar btn-close-white se necessário
    const closeBtn = header.querySelector('.btn-close') as HTMLElement;
    if (config.type !== 'warning') {
      closeBtn.classList.add('btn-close-white');
    } else {
      closeBtn.classList.remove('btn-close-white');
    }

    title.textContent = config.title;
    message.innerHTML = config.message.replace(/\\n/g, '<br>');

    // Configurar botões
    footer.innerHTML = '';
    
    if (config.type === 'confirm') {
      // Modal de confirmação
      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn btn-secondary-custom';
      cancelBtn.textContent = config.cancelText || 'Cancelar';
      cancelBtn.setAttribute('data-bs-dismiss', 'modal');
      cancelBtn.onclick = () => {
        if (config.onCancel) config.onCancel();
      };

      const confirmBtn = document.createElement('button');
      confirmBtn.type = 'button';
      confirmBtn.className = 'btn btn-primary-custom';
      confirmBtn.textContent = config.confirmText || 'Confirmar';
      confirmBtn.onclick = () => {
        if (config.onConfirm) config.onConfirm();
        this.hide();
      };

      footer.appendChild(cancelBtn);
      footer.appendChild(confirmBtn);
    } else {
      // Modal simples
      const okBtn = document.createElement('button');
      okBtn.type = 'button';
      okBtn.className = 'btn btn-primary-custom';
      okBtn.textContent = 'OK';
      okBtn.setAttribute('data-bs-dismiss', 'modal');
      footer.appendChild(okBtn);
    }
  }

  show(config: ModalConfig): void {
    this.currentModal = config;
    this.updateModalContent(config);
    
    if (this.modalElement) {
      const modal = new (window as any).bootstrap.Modal(this.modalElement);
      modal.show();
    }
  }

  hide(): void {
    if (this.modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(this.modalElement);
      if (modal) {
        modal.hide();
      }
    }
  }

  // Métodos de conveniência
  showSuccess(title: string, message: string): void {
    this.show({
      title,
      message,
      type: 'success'
    });
  }

  showError(title: string, message: string): void {
    this.show({
      title,
      message,
      type: 'error'
    });
  }

  showWarning(title: string, message: string): void {
    this.show({
      title,
      message,
      type: 'warning'
    });
  }

  showInfo(title: string, message: string): void {
    this.show({
      title,
      message,
      type: 'info'
    });
  }

  showConfirm(title: string, message: string, onConfirm: () => void, onCancel?: () => void, confirmText?: string, cancelText?: string): void {
    this.show({
      title,
      message,
      type: 'confirm',
      confirmText,
      cancelText,
      onConfirm,
      onCancel
    });
  }
}
