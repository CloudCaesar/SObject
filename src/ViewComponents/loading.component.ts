export class LoadingComponent {
    render(): string {
        return `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="text-align: center;">
                    <div style="border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                    <p style="margin: 0; color: #666;">Loading...</p>
                </div>
            </div>
        `;
    }
}