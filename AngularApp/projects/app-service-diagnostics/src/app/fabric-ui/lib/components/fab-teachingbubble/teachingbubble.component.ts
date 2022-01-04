// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ReactWrapperComponent } from '@angular-react/core';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  Renderer2,
  ViewChild,  
} from '@angular/core';
import { ITeachingBubbleProps } from 'office-ui-fabric-react/lib/TeachingBubble';



@Component({
  selector: 'fab-teachingbubble',
  exportAs: 'fabTeachingbubble',
  template: `
    <TeachingBubble
      #reactNode
      [target]="target"
      [ariaDescribedBy]="ariaDescribedBy"            
      [ariaLabelledBy]="ariaLabelledBy"
      [calloutProps]="calloutProps"  
      [componentRef]="componentRef" 
      [footerContent]="footerContent"  
      [closeButtonAriaLabel]="closeButtonAriaLabel"           
      [hasCloseButton]="hasCloseButton"            
      [headline]="headline"      
      (onDismiss)="onDismiss.emit($event)"            
      [primaryButtonProps]="primaryButtonProps"
      [secondaryButtonProps]="secondaryButtonProps"      
      [styles]="styles"      
      [theme]="theme"      
    >
      <ReactContent><ng-content></ng-content></ReactContent>
    </TeachingBubble>
  `,
  styles: ['react-renderer'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FabTeachingBubbleComponent extends ReactWrapperComponent<ITeachingBubbleProps> {
  @ViewChild('reactNode', { static: true }) protected reactNodeRef: ElementRef;

  @Input() target?: ITeachingBubbleProps['target'];
  @Input() ariaDescribedBy?: ITeachingBubbleProps['ariaDescribedBy'];
  @Input() ariaLabelledBy?: ITeachingBubbleProps['ariaLabelledBy'];
  @Input() calloutProps?: ITeachingBubbleProps['calloutProps'];
  @Input() componentRef?: ITeachingBubbleProps['componentRef'];  
  @Input() footerContent?: ITeachingBubbleProps['footerContent'];
  @Input() closeButtonAriaLabel?: ITeachingBubbleProps['closeButtonAriaLabel'];
  @Input() hasCloseButton?: boolean;  
  @Input() headline?: ITeachingBubbleProps['headline'];
  @Input() primaryButtonProps?: ITeachingBubbleProps['primaryButtonProps'];
  @Input() secondaryButtonProps?: ITeachingBubbleProps['secondaryButtonProps']; 
  @Input() styles?: ITeachingBubbleProps['styles'];
  @Input() theme?: ITeachingBubbleProps['theme'];  

  @Output() readonly onDismiss = new EventEmitter<{ ev?: any }>();
  

  constructor(elementRef: ElementRef, changeDetectorRef: ChangeDetectorRef, renderer: Renderer2) {
    super(elementRef, changeDetectorRef, renderer);
  }
}