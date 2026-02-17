/**
 * Utility for building HTML pages with consistent structure
 */
export class HtmlPageBuilder {
    /**
     * Wrap a template/content in a complete HTML page
     */
    static build(content: string, title: string = 'Page'): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/semantic-ui@2.4.2/dist/semantic.min.css">
    <style>
        body {
            margin: 0;
            background-color: #f8f9fa;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }
        :host {
            display: block;
            width: 100%;
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;
    }

    /**
     * Build error page
     */
    static buildError(errorMessage: string, errorStack?: string): string {
        const stackHtml = errorStack ? `
        <div style="margin-top: 20px;">
            <strong>Stack Trace:</strong>
            <pre style="white-space: pre-wrap; word-wrap: break-word; font-size: 12px; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">${this.escapeHtml(errorStack)}</pre>
        </div>` : '';

        const content = `
    <div class="ui negative message">
        <div class="header">Error Loading Data</div>
        <p>${this.escapeHtml(errorMessage)}</p>
        ${stackHtml}
    </div>`;

        return this.build(content, 'Error');
    }

    /**
     * Escape HTML entities
     */
    private static escapeHtml(text: string | undefined | null): string {
        if (!text) return '';
        const map: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, (m) => map[m]);
    }
}
