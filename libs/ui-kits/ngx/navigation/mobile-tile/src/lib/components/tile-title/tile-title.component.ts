import { Component, OnInit, ElementRef, inject } from '@angular/core';

@Component({
  selector: 'tamu-gisc-tile-title',
  templateUrl: './tile-title.component.html',
  styleUrls: ['./tile-title.component.scss']
})
export class TileTitleComponent implements OnInit {
  private view = inject(ElementRef);

  public title: string;

  /** The title's own element, which a page may have given a handler of its own, as the GIS Day Login tile does. */
  public get element(): HTMLElement {
    return this.view.nativeElement;
  }

  public ngOnInit() {
    this.title = (this.view.nativeElement as HTMLElement).innerText;
  }
}
