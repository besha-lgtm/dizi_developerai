import {
  DomHandler
} from "./chunk-XGEPVEWY.js";
import {
  CommonModule,
  NgClass,
  NgIf,
  NgStyle
} from "./chunk-DRDRYKEJ.js";
import {
  DOCUMENT
} from "./chunk-VENUZGNW.js";
import {
  SharedModule,
  UniqueComponentId
} from "./chunk-YK33QEEM.js";
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  Inject,
  Input,
  NgModule,
  Renderer2,
  ViewEncapsulation,
  booleanAttribute,
  setClassMetadata,
  ɵɵNgOnChangesFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdirectiveInject,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate
} from "./chunk-N7KPFZPD.js";
import "./chunk-DUSJOH2Q.js";
import "./chunk-LQ2OTQQK.js";
import "./chunk-V67RZGAX.js";

// ../../../node_modules/primeng/fesm2022/primeng-badge.mjs
function Badge_span_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 1);
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    ɵɵclassMap(ctx_r0.styleClass);
    ɵɵproperty("ngClass", ctx_r0.containerClass())("ngStyle", ctx_r0.style);
    ɵɵadvance();
    ɵɵtextInterpolate(ctx_r0.value);
  }
}
var BadgeDirective = class _BadgeDirective {
  document;
  el;
  renderer;
  /**
   * When specified, disables the component.
   * @group Props
   */
  disabled;
  /**
   * Size of the badge, valid options are "large" and "xlarge".
   * @group Props
   */
  badgeSize;
  /**
   * Size of the badge, valid options are "large" and "xlarge".
   * @group Props
   * @deprecated use badgeSize instead.
   */
  set size(value) {
    this._size = value;
    console.warn("size property is deprecated and will removed in v18, use badgeSize instead.");
  }
  get size() {
    return this._size;
  }
  _size;
  /**
   * Severity type of the badge.
   * @group Props
   */
  severity;
  /**
   * Value to display inside the badge.
   * @group Props
   */
  value;
  /**
   * Inline style of the element.
   * @group Props
   */
  badgeStyle;
  /**
   * Class of the element.
   * @group Props
   */
  badgeStyleClass;
  id;
  badgeEl;
  get activeElement() {
    return this.el.nativeElement.nodeName.indexOf("-") != -1 ? this.el.nativeElement.firstChild : this.el.nativeElement;
  }
  get canUpdateBadge() {
    return this.id && !this.disabled;
  }
  constructor(document, el, renderer) {
    this.document = document;
    this.el = el;
    this.renderer = renderer;
  }
  ngOnChanges({
    value,
    size,
    severity,
    disabled,
    badgeStyle,
    badgeStyleClass
  }) {
    if (disabled) {
      this.toggleDisableState();
    }
    if (!this.canUpdateBadge) {
      return;
    }
    if (severity) {
      this.setSeverity(severity.previousValue);
    }
    if (size) {
      this.setSizeClasses();
    }
    if (value) {
      this.setValue();
    }
    if (badgeStyle || badgeStyleClass) {
      this.applyStyles();
    }
  }
  ngAfterViewInit() {
    this.id = UniqueComponentId() + "_badge";
    this.renderBadgeContent();
  }
  setValue(element) {
    const badge = element ?? this.document.getElementById(this.id);
    if (!badge) {
      return;
    }
    if (this.value != null) {
      if (DomHandler.hasClass(badge, "p-badge-dot")) {
        DomHandler.removeClass(badge, "p-badge-dot");
      }
      if (this.value && String(this.value).length === 1) {
        DomHandler.addClass(badge, "p-badge-no-gutter");
      } else {
        DomHandler.removeClass(badge, "p-badge-no-gutter");
      }
    } else {
      if (!DomHandler.hasClass(badge, "p-badge-dot")) {
        DomHandler.addClass(badge, "p-badge-dot");
      }
      DomHandler.removeClass(badge, "p-badge-no-gutter");
    }
    badge.innerHTML = "";
    const badgeValue = this.value != null ? String(this.value) : "";
    this.renderer.appendChild(badge, this.document.createTextNode(badgeValue));
  }
  setSizeClasses(element) {
    const badge = element ?? this.document.getElementById(this.id);
    if (!badge) {
      return;
    }
    if (this.badgeSize) {
      if (this.badgeSize === "large") {
        DomHandler.addClass(badge, "p-badge-lg");
        DomHandler.removeClass(badge, "p-badge-xl");
      }
      if (this.badgeSize === "xlarge") {
        DomHandler.addClass(badge, "p-badge-xl");
        DomHandler.removeClass(badge, "p-badge-lg");
      }
    } else if (this.size && !this.badgeSize) {
      if (this.size === "large") {
        DomHandler.addClass(badge, "p-badge-lg");
        DomHandler.removeClass(badge, "p-badge-xl");
      }
      if (this.size === "xlarge") {
        DomHandler.addClass(badge, "p-badge-xl");
        DomHandler.removeClass(badge, "p-badge-lg");
      }
    } else {
      DomHandler.removeClass(badge, "p-badge-lg");
      DomHandler.removeClass(badge, "p-badge-xl");
    }
  }
  renderBadgeContent() {
    if (this.disabled) {
      return null;
    }
    const el = this.activeElement;
    const badge = this.document.createElement("span");
    badge.id = this.id;
    badge.className = "p-badge p-component";
    this.setSeverity(null, badge);
    this.setSizeClasses(badge);
    this.setValue(badge);
    DomHandler.addClass(el, "p-overlay-badge");
    this.renderer.appendChild(el, badge);
    this.badgeEl = badge;
    this.applyStyles();
  }
  applyStyles() {
    if (this.badgeEl && this.badgeStyle && typeof this.badgeStyle === "object") {
      for (const [key, value] of Object.entries(this.badgeStyle)) {
        this.renderer.setStyle(this.badgeEl, key, value);
      }
    }
    if (this.badgeEl && this.badgeStyleClass) {
      this.badgeEl.classList.add(...this.badgeStyleClass.split(" "));
    }
  }
  setSeverity(oldSeverity, element) {
    const badge = element ?? this.document.getElementById(this.id);
    if (!badge) {
      return;
    }
    if (this.severity) {
      DomHandler.addClass(badge, `p-badge-${this.severity}`);
    }
    if (oldSeverity) {
      DomHandler.removeClass(badge, `p-badge-${oldSeverity}`);
    }
  }
  toggleDisableState() {
    if (!this.id) {
      return;
    }
    if (this.disabled) {
      const badge = this.activeElement?.querySelector(`#${this.id}`);
      if (badge) {
        this.renderer.removeChild(this.activeElement, badge);
      }
    } else {
      this.renderBadgeContent();
    }
  }
  static ɵfac = function BadgeDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BadgeDirective)(ɵɵdirectiveInject(DOCUMENT), ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(Renderer2));
  };
  static ɵdir = ɵɵdefineDirective({
    type: _BadgeDirective,
    selectors: [["", "pBadge", ""]],
    hostAttrs: [1, "p-element"],
    inputs: {
      disabled: [0, "badgeDisabled", "disabled"],
      badgeSize: "badgeSize",
      size: "size",
      severity: "severity",
      value: "value",
      badgeStyle: "badgeStyle",
      badgeStyleClass: "badgeStyleClass"
    },
    standalone: false,
    features: [ɵɵNgOnChangesFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BadgeDirective, [{
    type: Directive,
    args: [{
      selector: "[pBadge]",
      host: {
        class: "p-element"
      }
    }]
  }], () => [{
    type: Document,
    decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }]
  }, {
    type: ElementRef
  }, {
    type: Renderer2
  }], {
    disabled: [{
      type: Input,
      args: ["badgeDisabled"]
    }],
    badgeSize: [{
      type: Input
    }],
    size: [{
      type: Input
    }],
    severity: [{
      type: Input
    }],
    value: [{
      type: Input
    }],
    badgeStyle: [{
      type: Input
    }],
    badgeStyleClass: [{
      type: Input
    }]
  });
})();
var Badge = class _Badge {
  /**
   * Class of the element.
   * @group Props
   */
  styleClass;
  /**
   * Inline style of the element.
   * @group Props
   */
  style;
  /**
   * Size of the badge, valid options are "large" and "xlarge".
   * @group Props
   */
  badgeSize;
  /**
   * Severity type of the badge.
   * @group Props
   */
  severity;
  /**
   * Value to display inside the badge.
   * @group Props
   */
  value;
  /**
   * When specified, disables the component.
   * @group Props
   */
  badgeDisabled = false;
  /**
   * Size of the badge, valid options are "large" and "xlarge".
   * @group Props
   * @deprecated use badgeSize instead.
   */
  set size(value) {
    this._size = value;
    console.warn("size property is deprecated and will removed in v18, use badgeSize instead.");
  }
  get size() {
    return this._size;
  }
  _size;
  containerClass() {
    return {
      "p-badge p-component": true,
      "p-badge-no-gutter": this.value != void 0 && String(this.value).length === 1,
      "p-badge-lg": this.badgeSize === "large" || this.size === "large",
      "p-badge-xl": this.badgeSize === "xlarge" || this.size === "xlarge",
      [`p-badge-${this.severity}`]: this.severity
    };
  }
  static ɵfac = function Badge_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _Badge)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _Badge,
    selectors: [["p-badge"]],
    hostAttrs: [1, "p-element"],
    inputs: {
      styleClass: "styleClass",
      style: "style",
      badgeSize: "badgeSize",
      severity: "severity",
      value: "value",
      badgeDisabled: [2, "badgeDisabled", "badgeDisabled", booleanAttribute],
      size: "size"
    },
    standalone: false,
    decls: 1,
    vars: 1,
    consts: [[3, "ngClass", "class", "ngStyle", 4, "ngIf"], [3, "ngClass", "ngStyle"]],
    template: function Badge_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵtemplate(0, Badge_span_0_Template, 2, 5, "span", 0);
      }
      if (rf & 2) {
        ɵɵproperty("ngIf", !ctx.badgeDisabled);
      }
    },
    dependencies: [NgClass, NgIf, NgStyle],
    styles: ["@layer primeng{.p-badge{display:inline-block;border-radius:10px;text-align:center;padding:0 .5rem}.p-overlay-badge{position:relative}.p-overlay-badge .p-badge{position:absolute;top:0;right:0;transform:translate(50%,-50%);transform-origin:100% 0;margin:0}.p-badge-dot{width:.5rem;min-width:.5rem;height:.5rem;border-radius:50%;padding:0}.p-badge-no-gutter{padding:0;border-radius:50%}}\n"],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Badge, [{
    type: Component,
    args: [{
      selector: "p-badge",
      template: ` <span *ngIf="!badgeDisabled" [ngClass]="containerClass()" [class]="styleClass" [ngStyle]="style">{{ value }}</span> `,
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation.None,
      host: {
        class: "p-element"
      },
      styles: ["@layer primeng{.p-badge{display:inline-block;border-radius:10px;text-align:center;padding:0 .5rem}.p-overlay-badge{position:relative}.p-overlay-badge .p-badge{position:absolute;top:0;right:0;transform:translate(50%,-50%);transform-origin:100% 0;margin:0}.p-badge-dot{width:.5rem;min-width:.5rem;height:.5rem;border-radius:50%;padding:0}.p-badge-no-gutter{padding:0;border-radius:50%}}\n"]
    }]
  }], null, {
    styleClass: [{
      type: Input
    }],
    style: [{
      type: Input
    }],
    badgeSize: [{
      type: Input
    }],
    severity: [{
      type: Input
    }],
    value: [{
      type: Input
    }],
    badgeDisabled: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    size: [{
      type: Input
    }]
  });
})();
var BadgeModule = class _BadgeModule {
  static ɵfac = function BadgeModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BadgeModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _BadgeModule,
    declarations: [Badge, BadgeDirective],
    imports: [CommonModule],
    exports: [Badge, BadgeDirective, SharedModule]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [CommonModule, SharedModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BadgeModule, [{
    type: NgModule,
    args: [{
      imports: [CommonModule],
      exports: [Badge, BadgeDirective, SharedModule],
      declarations: [Badge, BadgeDirective]
    }]
  }], null, null);
})();
export {
  Badge,
  BadgeDirective,
  BadgeModule
};
//# sourceMappingURL=primeng_badge.js.map
