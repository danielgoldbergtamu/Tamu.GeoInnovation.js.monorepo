import { AfterContentInit, Component, HostListener, OnDestroy, computed, inject, contentChild } from '@angular/core';
import { outputToObservable } from '@angular/core/rxjs-interop';
import { Subject, takeUntil } from 'rxjs';

import { TileTitleComponent } from '../tile-title/tile-title.component';
import { TileSubmenuDirective } from '../../directives/tile-submenu/tile-submenu.directive';
import { TileService } from '../../services/tile.service';
import { TileLinkDirective } from '../../directives/tile-link/tile-link.directive';
import { TileNavigationComponent } from '../tile-navigation/tile-navigation.component';

/**
 * A tile in a phone menu. The whole tile does what the tile is for: follows its link, or opens its submenu (#2588).
 *
 * The link directive sits on the tile's title, so until #2588 only the word followed the link, a tenth of the tile or
 * less, and a keyboard could not reach the tile at all. A tile with a link is now a link and one with a submenu a
 * button, each reachable with Tab and set off with Enter (and Space, for a button), with a visible focus. A tile with
 * neither, whose title the page handles itself (the GIS Day Login tile), passes a tap elsewhere on the tile to its
 * title and leaves the keyboard to it.
 */
@Component({
  selector: 'tamu-gisc-tile',
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.scss'],
  imports: [TileNavigationComponent],
  host: {
    '[attr.role]': 'role()',
    '[attr.tabindex]': 'role() ? 0 : null',
    '[attr.aria-haspopup]': "submenu() ? 'true' : null"
  }
})
export class TileComponent implements AfterContentInit, OnDestroy {
  private service = inject(TileService);

  private _destroy$: Subject<boolean> = new Subject();

  public readonly title = contentChild(TileTitleComponent);

  // A tile can redirect to open a submenu. Need a reference to the submenu template to render it.
  public readonly submenu = contentChild(TileSubmenuDirective);

  // A tile can have a link directive to link directly to a location. Need a reference to the link directive
  // to subscribe to its click event and toggle the menu.
  public readonly link = contentChild(TileLinkDirective);

  /** What the tile is to a keyboard and a screen reader: a link, a button for its submenu, or nothing of its own. */
  protected readonly role = computed(() => (this.link() ? 'link' : this.submenu() ? 'button' : null));

  @HostListener('click', ['$event'])
  protected _tileClick(event: MouseEvent) {
    if (this.submenu()) {
      this.openSubmenu();

      return;
    }

    const link = this.link();

    // A click on the link's own element is the link's: it follows it itself.
    if (link) {
      if (!link.contains(event.target)) {
        link.follow();
      }

      return;
    }

    const title = this.title()?.element;

    if (title && !(event.target instanceof Node && title.contains(event.target))) {
      title.click();
    }
  }

  @HostListener('keydown', ['$event'])
  protected _tileKey(event: KeyboardEvent) {
    // Only the tile's own focus: a key on a title the page made focusable is the page's.
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key === 'Enter' && this.link()) {
      this.link().follow();
    } else if ((event.key === 'Enter' || event.key === ' ') && this.submenu()) {
      event.preventDefault();
      this.openSubmenu();
    }
  }

  public ngAfterContentInit(): void {
    const link = this.link();
    if (link) {
      outputToObservable(link.clicked)
        .pipe(takeUntil(this._destroy$))
        .subscribe(() => {
          this.service.toggleMenu(false);
        });
    }
  }

  public ngOnDestroy(): void {
    this._destroy$.next(null);
    this._destroy$.complete();
  }

  private openSubmenu() {
    this.service.updateSubmenu({
      template: this.submenu().template,
      title: this.title().title
    });

    this.service.toggleSubmenu(true);
  }
}
