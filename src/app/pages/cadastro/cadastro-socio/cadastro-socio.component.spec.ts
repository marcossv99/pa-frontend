import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadastroSocioComponent } from './cadastro-socio.component';

describe('CadastroSocioComponent', () => {
  let component: CadastroSocioComponent;
  let fixture: ComponentFixture<CadastroSocioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadastroSocioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CadastroSocioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
