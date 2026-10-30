import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { TileComponent } from './tile.component';
import { TileIconComponent } from '../tile-icon/tile-icon.component';
import { TileTitleComponent } from '../tile-title/tile-title.component';
import { TileLinkDirective } from '../../directives/tile-link/tile-link.directive';
import { TileSubmenuDirective } from '../../directives/tile-submenu/tile-submenu.directive';
import { TileService } from '../../services/tile.service';

/**
 * The tiles of a phone menu, as the GIS Day header writes them: one that links, one that opens a submenu, and one
 * whose title the page handles itself.
 */
@Component({
  template: `
    <tamu-gisc-tile class="linked">
      <tamu-gisc-tile-icon><div class="material-icons">people</div></tamu-gisc-tile-icon>
      <tamu-gisc-tile-title tamuGiscTileLink location="presenters">Presenters</tamu-gisc-tile-title>
    </tamu-gisc-tile>
    <tamu-gisc-tile class="submenu">
      <tamu-gisc-tile-icon><div class="material-icons">info</div></tamu-gisc-tile-icon>
      <tamu-gisc-tile-title>About</tamu-gisc-tile-title>
      <ng-template giscTileSubmenu><p>Sponsors</p></ng-template>
    </tamu-gisc-tile>
    <tamu-gisc-tile class="own">
      <tamu-gisc-tile-icon><div class="material-icons">login</div></tamu-gisc-tile-icon>
      <tamu-gisc-tile-title tabindex="0" role="button" (click)="login()">Login</tamu-gisc-tile-title>
    </tamu-gisc-tile>
  `,
  imports: [TileComponent, TileIconComponent, TileTitleComponent, TileLinkDirective, TileSubmenuDirective]
})
class MenuComponent {
  public logins = 0;

  public login() {
    this.logins++;
  }
}

/**
 * Regression coverage (#2588). In the GIS Day phone menu only a tile's word followed its link: the link directive sits
 * on the title, which is a tenth of the tile or less, so a tap on the icon or around the word did nothing, and a
 * keyboard could not reach the tile at all.
 */
describe('TileComponent', () => {
  let fixture: ComponentFixture<MenuComponent>;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let service: TileService;

  const tile = (which: string): HTMLElement => fixture.nativeElement.querySelector(`tamu-gisc-tile.${which}`);

  beforeEach(async () => {
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MenuComponent],
      providers: [{ provide: Router, useValue: router }]
    }).compileComponents();

    service = TestBed.inject(TileService);
    fixture = TestBed.createComponent(MenuComponent);
    fixture.detectChanges();
  });

  describe('a tile with a link', () => {
    it('follows the link from its icon, not only its word', () => {
      tile('linked').querySelector<HTMLElement>('tamu-gisc-tile-icon').click();

      expect(router.navigate).toHaveBeenCalledWith(['presenters'], undefined);
    });

    it('follows the link from anywhere on the tile, and closes the menu', () => {
      const toggleMenu = vi.spyOn(service, 'toggleMenu');

      tile('linked').click();

      expect(router.navigate).toHaveBeenCalledWith(['presenters'], undefined);
      expect(toggleMenu).toHaveBeenCalledWith(false);
    });

    it('follows the link once from its word', () => {
      tile('linked').querySelector<HTMLElement>('tamu-gisc-tile-title').click();

      expect(router.navigate).toHaveBeenCalledTimes(1);
    });

    it('is a link a keyboard can reach, and Enter follows it', () => {
      expect(tile('linked').getAttribute('role')).toBe('link');
      expect(tile('linked').getAttribute('tabindex')).toBe('0');

      tile('linked').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(router.navigate).toHaveBeenCalledWith(['presenters'], undefined);
    });
  });

  describe('a tile with a submenu (About)', () => {
    it('opens its submenu from its icon, as today', () => {
      const toggleSubmenu = vi.spyOn(service, 'toggleSubmenu');

      tile('submenu').querySelector<HTMLElement>('tamu-gisc-tile-icon').click();

      expect(toggleSubmenu).toHaveBeenCalledWith(true);
      // The submenu's title is read with innerText, which jsdom does not implement: its template is what shows it opened.
      expect(service.activeSubMenu.getValue().template).toBeDefined();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('is a button a keyboard can reach, and Enter opens the submenu', () => {
      const toggleSubmenu = vi.spyOn(service, 'toggleSubmenu');

      expect(tile('submenu').getAttribute('role')).toBe('button');
      expect(tile('submenu').getAttribute('tabindex')).toBe('0');

      tile('submenu').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(toggleSubmenu).toHaveBeenCalledWith(true);
    });
  });

  describe('a tile whose title the page handles (Login)', () => {
    it('passes a tap on its icon to its title, once', () => {
      tile('own').querySelector<HTMLElement>('tamu-gisc-tile-icon').click();
      tile('own').querySelector<HTMLElement>('tamu-gisc-tile-title').click();

      expect(fixture.componentInstance.logins).toBe(2);
    });

    it('leaves the keyboard to the title the page made focusable', () => {
      expect(tile('own').getAttribute('role')).toBeNull();
      expect(tile('own').getAttribute('tabindex')).toBeNull();
    });
  });
});
