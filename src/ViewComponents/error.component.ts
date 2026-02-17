/*
 * Copyright (c) 2026 Cloud CZR LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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