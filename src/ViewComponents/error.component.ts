export class ErrorComponent {
    private errorMessage: string;
    private errorStack: string;

    constructor(props: { errorMessage: string; errorStack?: string }) {
        this.errorMessage = props.errorMessage;
        this.errorStack = props.errorStack || '';
    }

    render(): string {
        const stackHtml = this.errorStack ? `
        <div style="margin-top: 20px;">
            <strong>Stack Trace:</strong>
            <pre style="white-space: pre-wrap; word-wrap: break-word; font-size: 12px; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">${this.escapeHtml(this.errorStack)}</pre>
        </div>` : '';

        return `
    <div class="ui negative message">
        <div class="header">Error Loading Data</div>
        <p>${this.escapeHtml(this.errorMessage)}</p>
        ${stackHtml}
    </div>`;
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}