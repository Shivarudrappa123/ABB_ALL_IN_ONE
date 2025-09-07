import { TestBed } from '@angular/core/testing';

import { ProjectState } from './project-state';

describe('ProjectState', () => {
  let service: ProjectState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
