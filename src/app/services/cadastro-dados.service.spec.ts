import { TestBed } from '@angular/core/testing';

import { CadastroDadosService } from './cadastro-dados.service';

describe('CadastroDadosService', () => {
  let service: CadastroDadosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CadastroDadosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
