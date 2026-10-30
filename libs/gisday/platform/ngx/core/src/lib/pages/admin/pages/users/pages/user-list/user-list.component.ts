import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, debounceTime, distinctUntilChanged, map, startWith, switchMap } from 'rxjs';

import { UserService } from '@tamu-gisc/gisday/platform/ngx/data-access';
import { Auth0UserList } from '@tamu-gisc/common/nest/auth';
import { TextboxComponent } from '@tamu-gisc/ui-kits/ngx/forms';

@Component({
  selector: 'tamu-gisc-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [AsyncPipe, ReactiveFormsModule, TextboxComponent]
})
export class UserListComponent implements OnInit {
  private readonly us = inject(UserService);

  /** Asks the API, which searches every Auth0 user, not only the first 1,000 the list can hold (#2574). */
  public readonly search = new FormControl('', { nonNullable: true });

  /** The users, or null while they load. */
  public users$: Observable<Auth0UserList | null>;

  public ngOnInit(): void {
    this.users$ = this.search.valueChanges.pipe(
      debounceTime(400),
      startWith(this.search.value),
      map((q) => q.trim()),
      distinctUntilChanged(),
      switchMap((q) => this.us.getUsers(q || undefined).pipe(startWith(null)))
    );
  }
}
