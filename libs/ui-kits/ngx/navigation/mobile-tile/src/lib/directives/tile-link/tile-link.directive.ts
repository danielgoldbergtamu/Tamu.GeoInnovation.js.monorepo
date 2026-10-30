import { Directive, ElementRef, HostListener, Renderer2, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';

@Directive({ selector: '[tamuGiscTileLink]' })
export class TileLinkDirective {
  private router = inject(Router);
  private renderer = inject(Renderer2);
  private el = inject(ElementRef);

  /**
   * Location of the link to redirect to. Can be internal relative URL or absolute external URL
   *
   */
  public readonly location = input<string>(undefined);

  /**
   * Used when input location is a relative application link
   */
  public readonly fragment = input<string>(undefined);

  public readonly clicked = output<HTMLElement>();

  @HostListener('click', ['$event.target'])
  protected _click(target: HTMLElement) {
    this.follow(target);
  }

  /** Whether `target` is this link's own element or inside it, so a click there is the link's own. */
  public contains(target: EventTarget | null): boolean {
    return target instanceof Node && (this.el.nativeElement as HTMLElement).contains(target);
  }

  /**
   * Goes to the location. Called on a click on the link's own element, and by the tile around it for a click or key
   * anywhere else on the tile (#2588).
   */
  public follow(target: HTMLElement = this.el.nativeElement) {
    const lt = this.testLocation(this.location());

    if (lt === LocationType.EXTERNAL) {
      window.location.href = this.location();
    } else if (lt === LocationType.INTERNAL) {
      const fragment = this.fragment();
      this.router.navigate([this.location()], fragment ? { fragment: fragment } : undefined);
    }

    this.clicked.emit(target);
  }

  private testLocation(loc: string): LocationType {
    const reg = new RegExp('^(http|https)://', 'i');
    const isAbsolute = reg.test(loc);

    if (isAbsolute) {
      return LocationType.EXTERNAL;
    } else {
      return LocationType.INTERNAL;
    }
  }
}

export enum LocationType {
  INTERNAL,
  EXTERNAL
}
