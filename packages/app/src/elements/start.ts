import { shared, mixins } from "../styles";
import { StateMixin } from "../mixins/state";
import { Routing } from "../mixins/routing";
import { BaseElement, element, html, css, property } from "./base";
import "./unlock";
import "./login";
import "./signup";
import "./recover";

@element("pl-start")
export class Start extends Routing(StateMixin(BaseElement)) {
    readonly routePattern = /^(unlock|login|signup|recover)/;

    // private readonly _pages = ["unlock", "login", "signup", "recover"];

    @property()
    private _page: string;

    handleRoute([page]: [string]) {
        this._page = page;
    }

    static styles = [
        shared,
        css`
            :host {
                --color-foreground: var(--color-white);
                --color-highlight: var(--color-black);
                color: var(--color-foreground);
                display: flex;
                flex-direction: column;
                z-index: 5;
                text-shadow: var(--text-shadow);
                background: var(--color-background);
                transition: transform 0.4s cubic-bezier(1, 0, 0.2, 1);
                ${mixins.fullbleed()}
            }

            :host(:not([active])) {
                pointer-events: none;
                transition-delay: 0.4s;
                transform: translate3d(0, -100%, 0);
            }
        `,
    ];

    render() {
        return html`
            <pl-unlock class="fullbleed" ?invisible=${this._page !== "unlock"}></pl-unlock>

            <pl-login class="fullbleed" ?invisible=${this._page !== "login"}></pl-login>

            <pl-signup class="fullbleed" ?invisible=${this._page !== "signup"}></pl-signup>

            <pl-recover class="fullbleed" ?invisible=${this._page !== "recover"}></pl-recover>
        `;
    }
}
