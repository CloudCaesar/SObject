export class LoadingComponent {
    private message: string;
    private size: 'small' | 'medium' | 'large';
    private showMessage: boolean;

    constructor(message: string = 'Loading...', options: { size?: 'small' | 'medium' | 'large'; showMessage?: boolean } = {}) {
        this.message = message;
        this.size = options.size || 'medium';
        this.showMessage = options.showMessage !== false;
    }

    render(): string {
        const sizeStyles = {
            small: { loaderSize: '20px', fontSize: '14px', marginBottom: '10px' },
            medium: { loaderSize: '40px', fontSize: '16px', marginBottom: '20px' },
            large: { loaderSize: '60px', fontSize: '18px', marginBottom: '25px' }
        };

        const style = sizeStyles[this.size];

        return `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div class="ui active inline loader" style="margin-bottom: ${style.marginBottom};"></div>
                ${this.showMessage ? `<p style="margin: 0; color: #666; font-size: ${style.fontSize};">${this.message}</p>` : ''}
            </div>
        `;
    }

    static render(message: string = 'Loading...', options: { size?: 'small' | 'medium' | 'large'; showMessage?: boolean } = {}): string {
        const component = new LoadingComponent(message, options);
        return component.render();
    }
}